import { EventEmitter } from 'node:events';
import type { ServerResponse } from 'node:http';

class MockServerResponse extends EventEmitter {
  writtenChunks: any[] = [];
  headers: Record<string, string> = {};
  statusCode = 0;
  statusMessage = '';
  ended = false;

  write(chunk: any): boolean {
    this.writtenChunks.push(chunk);
    return true;
  }

  end(): void {
    this.ended = true;
  }

  writeHead(
    statusCode: number,
    arg2: string | Record<string, string>,
    arg3?: Record<string, string>,
  ): void {
    this.statusCode = statusCode;

    if (typeof arg2 === 'string') {
      this.statusMessage = arg2;
      this.headers = arg3 ?? {};
    } else {
      this.statusMessage = '';
      this.headers = arg2;
    }
  }

  get body() {
    // 将所有写入的块组合成一个字符串
    return this.writtenChunks.join('');
  }

  /**
   * 获取解码后的块作为字符串。
   */
  getDecodedChunks() {
    const decoder = new TextDecoder();
    return this.writtenChunks.map(chunk => decoder.decode(chunk));
  }

  /**
   * 等待流完成写入模拟响应。
   */
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

export function createMockServerResponse(): ServerResponse &
  MockServerResponse {
  return new MockServerResponse() as ServerResponse & MockServerResponse;
}
