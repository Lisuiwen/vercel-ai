import type { ServerResponse } from 'node:http';

/**
 * 将流的内容写入服务器响应。
 */
export function writeToServerResponse({
  response,
  status,
  statusText,
  headers,
  stream,
}: {
  response: ServerResponse;
  status?: number;
  statusText?: string;
  headers?: Record<string, string | number | string[]>;
  stream: ReadableStream<Uint8Array>;
}): void {
  const statusCode = status ?? 200;
  if (statusText !== undefined) {
    response.writeHead(statusCode, statusText, headers);
  } else {
    response.writeHead(statusCode, headers);
  }

  const reader = stream.getReader();
  const read = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 尊敬背压：如果 write() 返回 false，则等待`drain`事件
        const canContinue = response.write(value);
        if (!canContinue) {
          await new Promise<void>(resolve => {
            response.once('drain', resolve);
          });
        }
      }
    } catch (error) {
      throw error;
    } finally {
      response.end();
    }
  };

  read();
}
