import { convertArrayToReadableStream } from '@ai-sdk/provider-utils/test';
import { createMockServerResponse } from '../test/mock-server-response';
import { pipeTextStreamToResponse } from './pipe-text-stream-to-response';
import { describe, it, expect } from 'vitest';

describe('pipeTextStreamToResponse', () => {
  it('should write to ServerResponse with correct headers and encoded stream', async () => {
    const mockResponse = createMockServerResponse();

    pipeTextStreamToResponse({
      response: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: {
        'Custom-Header': 'test',
      },
      textStream: convertArrayToReadableStream(['test-data']),
    });

    // 等待流完成写入
    await mockResponse.waitForEnd();

    // 验证响应属性
    expect(mockResponse.statusCode).toBe(200);
    expect(mockResponse.statusMessage).toBe('OK');

    // 验证标头
    expect(mockResponse.headers).toMatchInlineSnapshot(`
      {
        "content-type": "text/plain; charset=utf-8",
        "custom-header": "test",
      }
    `);

    // 使用解码的块验证写入的数据
    expect(mockResponse.getDecodedChunks()).toStrictEqual(['test-data']);
  });
});
