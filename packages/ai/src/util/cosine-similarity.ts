import { InvalidArgumentError } from '../error/invalid-argument-error';

/**
 * 计算两个向量之间的余弦相似度。这是一个有用的指标
 * 比较两个向量的相似度，例如嵌入。
 *
 * @param vector1 - 第一个向量。
 * @param vector2 - 第二个向量。
 *
 * @returns 矢量 1 和矢量 2 之间的余弦相似度，如果任一矢量都是零矢量，则为 0。
 *
 * @throws {InvalidArgumentError} 如果向量的长度不同。
 */
export function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new InvalidArgumentError({
      parameter: 'vector1,vector2',
      value: { vector1Length: vector1.length, vector2Length: vector2.length },
      message: `Vectors must have the same length`,
    });
  }

  const n = vector1.length;

  if (n === 0) {
    return 0; // 如果没有抛出错误，则为空向量返回 0
  }

  let magnitudeSquared1 = 0;
  let magnitudeSquared2 = 0;
  let dotProduct = 0;

  for (let i = 0; i < n; i++) {
    const value1 = vector1[i];
    const value2 = vector2[i];

    magnitudeSquared1 += value1 * value1;
    magnitudeSquared2 += value2 * value2;
    dotProduct += value1 * value2;
  }

  return magnitudeSquared1 === 0 || magnitudeSquared2 === 0
    ? 0
    : dotProduct /
        (Math.sqrt(magnitudeSquared1) * Math.sqrt(magnitudeSquared2));
}
