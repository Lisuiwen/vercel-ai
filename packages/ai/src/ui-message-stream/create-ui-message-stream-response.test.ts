import {
  convertArrayToReadableStream,
  convertReadableStreamToArray,
} from '@ai-sdk/provider-utils/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUIMessageStreamResponse } from './create-ui-message-stream-response';

describe('createUIMessageStreamResponse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a Response with correct headers and encoded stream', async () => {
    const response = createUIMessageStreamResponse({
      status: 200,
      statusText: 'OK',
      headers: {
        'Custom-Header': 'test',
      },
      stream: convertArrayToReadableStream([
        { type: 'text-delta', id: '1', delta: 'test-data' },
      ]),
    });

    // 验证响应属性
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');

    // 验证标头
    expect(Object.fromEntries(response.headers.entries()))
      .toMatchInlineSnapshot(`
        {
          "cache-control": "no-cache",
          "connection": "keep-alive",
          "content-type": "text/event-stream",
          "custom-header": "test",
          "x-accel-buffering": "no",
          "x-vercel-ai-ui-message-stream": "v1",
        }
      `);

    expect(
      await convertReadableStreamToArray(
        response.body!.pipeThrough(new TextDecoderStream()),
      ),
    ).toMatchInlineSnapshot(`
      [
        "data: {"type":"text-delta","id":"1","delta":"test-data"}

      ",
        "data: [DONE]

      ",
      ]
    `);
  });

  it('should handle errors in the stream', async () => {
    const response = createUIMessageStreamResponse({
      status: 200,
      stream: convertArrayToReadableStream([
        { type: 'error', errorText: 'Custom error message' },
      ]),
    });

    expect(
      await convertReadableStreamToArray(
        response.body!.pipeThrough(new TextDecoderStream()),
      ),
    ).toMatchInlineSnapshot(`
      [
        "data: {"type":"error","errorText":"Custom error message"}

      ",
        "data: [DONE]

      ",
      ]
    `);
  });

  it('should call consumeSseStream with a teed stream', async () => {
    const consumedData: string[] = [];
    const consumeSseStream = vi.fn(
      async ({ stream }: { stream: ReadableStream<string> }) => {
        const data = await convertReadableStreamToArray(stream);
        consumedData.push(...data);
      },
    );

    const response = createUIMessageStreamResponse({
      status: 200,
      stream: convertArrayToReadableStream([
        { type: 'text-delta', id: '1', delta: 'test-data-1' },
        { type: 'text-delta', id: '1', delta: 'test-data-2' },
      ]),
      consumeSseStream,
    });

    // 验证 ConsumerSseStream 被调用
    expect(consumeSseStream).toHaveBeenCalledTimes(1);
    expect(consumeSseStream).toHaveBeenCalledWith({
      stream: expect.any(ReadableStream),
    });

    // 验证响应流是否仍然正常工作
    const responseData = await convertReadableStreamToArray(
      response.body!.pipeThrough(new TextDecoderStream()),
    );

    expect(responseData).toMatchInlineSnapshot(`
      [
        "data: {"type":"text-delta","id":"1","delta":"test-data-1"}

      ",
        "data: {"type":"text-delta","id":"1","delta":"test-data-2"}

      ",
        "data: [DONE]

      ",
      ]
    `);

    // 等待 ConsumerSseStream 完成
    await vi.advanceTimersByTimeAsync(0);

    // 验证 ConsumerSseStream 收到相同的数据
    expect(consumedData).toMatchInlineSnapshot(`
      [
        "data: {"type":"text-delta","id":"1","delta":"test-data-1"}

      ",
        "data: {"type":"text-delta","id":"1","delta":"test-data-2"}

      ",
        "data: [DONE]

      ",
      ]
    `);
  });

  it('should not block the response when consumeSseStream takes time', async () => {
    let consumeResolve: () => void;
    const consumePromise = new Promise<void>(resolve => {
      consumeResolve = resolve;
    });

    const consumeSseStream = vi.fn(
      async ({ stream }: { stream: ReadableStream<string> }) => {
        // 消耗流但等待外部解析
        await convertReadableStreamToArray(stream);
        await consumePromise;
      },
    );

    const response = createUIMessageStreamResponse({
      status: 200,
      stream: convertArrayToReadableStream([
        { type: 'text-delta', id: '1', delta: 'test-data' },
      ]),
      consumeSseStream,
    });

    // 即使 ConsumerSseStream 尚未完成，响应也应该立即可用
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    // 响应正文应该立即可读
    const responseData = await convertReadableStreamToArray(
      response.body!.pipeThrough(new TextDecoderStream()),
    );

    expect(responseData).toMatchInlineSnapshot(`
      [
        "data: {"type":"text-delta","id":"1","delta":"test-data"}

      ",
        "data: [DONE]

      ",
      ]
    `);

    // 验证 ConsumerSseStream 已被调用但可能仍在运行
    expect(consumeSseStream).toHaveBeenCalledTimes(1);

    // 现在解析consumeSseStream
    consumeResolve!();
  });

  it('should handle synchronous consumeSseStream', async () => {
    const consumedData: string[] = [];
    const consumeSseStream = vi.fn(
      ({ stream }: { stream: ReadableStream<string> }) => {
        // 同步消费（不返回承诺）
        stream.pipeTo(
          new WritableStream({
            write(chunk) {
              consumedData.push(chunk);
            },
          }),
        );
      },
    );

    const response = createUIMessageStreamResponse({
      status: 200,
      stream: convertArrayToReadableStream([
        { type: 'text-delta', id: '1', delta: 'sync-test' },
      ]),
      consumeSseStream,
    });

    expect(consumeSseStream).toHaveBeenCalledTimes(1);

    const responseData = await convertReadableStreamToArray(
      response.body!.pipeThrough(new TextDecoderStream()),
    );

    expect(responseData).toMatchInlineSnapshot(`
      [
        "data: {"type":"text-delta","id":"1","delta":"sync-test"}

      ",
        "data: [DONE]

      ",
      ]
    `);
  });

  it('should handle consumeSseStream errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const consumeSseStream = vi.fn(async () => {
      throw new Error('consumeSseStream error');
    });

    const response = createUIMessageStreamResponse({
      status: 200,
      stream: convertArrayToReadableStream([
        { type: 'text-delta', id: '1', delta: 'error-test' },
      ]),
      consumeSseStream,
    });

    // 即使 ConsumerSseStream 失败，响应也应该仍然有效
    const responseData = await convertReadableStreamToArray(
      response.body!.pipeThrough(new TextDecoderStream()),
    );

    expect(responseData).toMatchInlineSnapshot(`
      [
        "data: {"type":"text-delta","id":"1","delta":"error-test"}

      ",
        "data: [DONE]

      ",
      ]
    `);

    expect(consumeSseStream).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
