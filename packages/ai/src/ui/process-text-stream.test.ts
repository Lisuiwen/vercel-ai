import { convertArrayToReadableStream } from '@ai-sdk/provider-utils/test';
import { processTextStream } from './process-text-stream';
import { describe, it, expect, vi } from 'vitest';

describe('processTextStream', () => {
  it('should process stream chunks correctly', async () => {
    // 模拟数据
    const testData = ['Hello', ' ', 'World'];
    const chunks: string[] = [];

    // 使用实用程序创建流
    const encoder = new TextEncoder();
    const stream = convertArrayToReadableStream(
      testData.map(chunk => encoder.encode(chunk)),
    );

    // 模拟回调函数
    const onChunk = vi.fn((chunk: string) => {
      chunks.push(chunk);
    });

    // 处理流
    await processTextStream({ stream, onTextPart: onChunk });

    // 验证结果
    expect(onChunk).toHaveBeenCalledTimes(3);
    expect(chunks).toEqual(testData);
  });

  it('should handle empty streams', async () => {
    const onChunk = vi.fn();
    const stream = convertArrayToReadableStream<Uint8Array>([]);

    await processTextStream({ stream, onTextPart: onChunk });

    expect(onChunk).not.toHaveBeenCalled();
  });
});
