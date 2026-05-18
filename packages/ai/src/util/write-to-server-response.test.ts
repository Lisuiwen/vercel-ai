import { EventEmitter } from 'node:events';
import type { ServerResponse } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeToServerResponse } from './write-to-server-response';
import { createMockServerResponse } from '../test/mock-server-response';

describe('writeToServerResponse', () => {
  it('should write data to ServerResponse', async () => {
    const mockResponse = createMockServerResponse();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('chunk1'));
        controller.enqueue(new TextEncoder().encode('chunk2'));
        controller.close();
      },
    });

    writeToServerResponse({
      response: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/plain' },
      stream,
    });

    await mockResponse.waitForEnd();

    expect(mockResponse.statusCode).toBe(200);
    expect(mockResponse.statusMessage).toBe('OK');
    expect(mockResponse.writtenChunks).toHaveLength(2);
    expect(mockResponse.ended).toBe(true);
  });

  describe('backpressure handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should respect backpressure and wait for drain event', async () => {
      const mockResponse = createBackpressureMockResponse();
      let drainEventCount = 0;
      let readyToEnqueue: ((value: unknown) => void) | null = null;

      // 跟踪流失事件
      mockResponse.on('drain', () => {
        drainEventCount++;
      });

      // 创建按需提供块的流（异步）
      const stream = new ReadableStream({
        start(controller) {
          // 第一个块立即可用
          controller.enqueue(new TextEncoder().encode('chunk1'));
          // 设置附加块的回调
          readyToEnqueue = value => {
            if (value === null) {
              controller.close();
            } else {
              controller.enqueue(value as Uint8Array);
            }
          };
        },
      });

      writeToServerResponse({
        response: mockResponse,
        status: 200,
        stream,
      });

      // 等待第一个块被写入
      await vi.advanceTimersByTimeAsync(10);
      expect(mockResponse.writeCallCount).toBe(1);

      // 将第二个块加入队列 - 它应该触发返回 false 的写入（背压）
      readyToEnqueue!(new TextEncoder().encode('chunk2'));
      await vi.advanceTimersByTimeAsync(5);

      // 第二个块写入应该被调用但返回 false
      expect(mockResponse.writeCallCount).toBe(2);
      expect(mockResponse.writtenChunks.length).toBe(2);

      // 将第三个块入队 - 它不应该触发写入（仍在等待块 2 的耗尽）
      readyToEnqueue!(new TextEncoder().encode('chunk3'));
      await vi.advanceTimersByTimeAsync(5);

      // 第三块还不应该被写入（等待耗尽）
      expect(mockResponse.writeCallCount).toBe(2);

      // 模拟耗尽以允许第三次写入
      mockResponse.simulateDrain();
      await vi.advanceTimersByTimeAsync(10);
      expect(mockResponse.writeCallCount).toBe(3);

      // 关闭流
      readyToEnqueue!(null);
      await vi.runAllTimersAsync();

      expect(mockResponse.ended).toBe(true);

      // 验证是否调用了排水（表明遵守了背压）
      expect(drainEventCount).toBeGreaterThanOrEqual(1);
      // 验证所有块最终都已写入
      expect(mockResponse.writtenChunks).toHaveLength(3);
    });
  });

  it('should set headers correctly when statusText is undefined', async () => {
    const mockResponse = createMockServerResponse();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('test data'));
        controller.close();
      },
    });

    const expectedHeaders = {
      'X-Example-Header': 'example-value',
      'X-Example-Chat-Title': 'My Conversation',
    };

    writeToServerResponse({
      response: mockResponse,
      status: 200,
      statusText: undefined,
      headers: expectedHeaders,
      stream,
    });

    await mockResponse.waitForEnd();

    expect(mockResponse.statusCode).toBe(200);
    expect(mockResponse.headers).toEqual(expectedHeaders);
    expect(mockResponse.ended).toBe(true);
    expect(mockResponse.writtenChunks).toHaveLength(1);
  });

  it('should set headers correctly when statusText is provided', async () => {
    const mockResponse = createMockServerResponse();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('test data'));
        controller.close();
      },
    });

    const expectedHeaders = {
      'X-Example-Header': 'example-value',
      'X-Example-Chat-Title': 'New Chat Session',
    };

    writeToServerResponse({
      response: mockResponse,
      status: 201,
      statusText: 'Created',
      headers: expectedHeaders,
      stream,
    });

    await mockResponse.waitForEnd();

    expect(mockResponse.statusCode).toBe(201);
    expect(mockResponse.statusMessage).toBe('Created');
    expect(mockResponse.headers).toEqual(expectedHeaders);
    expect(mockResponse.ended).toBe(true);
    expect(mockResponse.writtenChunks).toHaveLength(1);
  });

  it('should set headers correctly when statusText is not set and status is not set', async () => {
    const mockResponse = createMockServerResponse();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('test data'));
        controller.close();
      },
    });

    const expectedHeaders = {
      'X-Example-Header': 'example-value',
      'X-Example-Message': 'Hello World',
    };

    writeToServerResponse({
      response: mockResponse,
      headers: expectedHeaders,
      stream,
    });

    await mockResponse.waitForEnd();

    expect(mockResponse.statusCode).toBe(200);
    expect(mockResponse.headers).toEqual(expectedHeaders);
    expect(mockResponse.ended).toBe(true);
    expect(mockResponse.writtenChunks).toHaveLength(1);
  });
});

class BackpressureMockResponse extends EventEmitter {
  writtenChunks: any[] = [];
  writeCallCount = 0;
  statusCode = 0;
  statusMessage = '';
  headers: Record<string, string | number | string[]> | undefined;
  ended = false;
  private shouldApplyBackpressure = false;

  write(chunk: any): boolean {
    this.writtenChunks.push(chunk);
    this.writeCallCount++;

    // 首次写入成功，后续写入信号反压
    if (this.writeCallCount === 1) {
      this.shouldApplyBackpressure = true;
      return true; // 第一次写没问题
    }

    // 如果我们处于背压模式，则返回 false
    if (this.shouldApplyBackpressure) {
      return false;
    }

    // 在drain之后，本次写入成功，但是接下来又需要drain
    this.shouldApplyBackpressure = true;
    return true;
  }

  simulateDrain(): void {
    this.shouldApplyBackpressure = false;
    this.emit('drain');
  }

  end(): void {
    this.ended = true;
  }

  writeHead(
    statusCode: number,
    statusMessage?: string,
    headers?: Record<string, string | number | string[]>,
  ): void {
    this.statusCode = statusCode;

    if (typeof statusMessage === 'string') {
      this.statusMessage = statusMessage;
      this.headers = headers;
    } else {
      this.statusMessage = '';
      this.headers = statusMessage;
    }
  }

  async waitForEnd() {
    await new Promise(resolve => {
      const checkIfEnded = () => {
        if (this.ended) {
          resolve(undefined);
        } else {
          setImmediate(checkIfEnded);
        }
      };
      checkIfEnded();
    });
  }
}

function createBackpressureMockResponse(): ServerResponse &
  BackpressureMockResponse {
  return new BackpressureMockResponse() as ServerResponse &
    BackpressureMockResponse;
}
