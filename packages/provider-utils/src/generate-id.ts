import { InvalidArgumentError } from '@ai-sdk/provider';

/**
 * 创建一个 ID 生成器。
 * ID的总长度是前缀、分隔符和随机部分长度的总和。
 * 不加密安全。
 *
 * @param alphabet - The alphabet to use for the ID. Default: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.
 * @param prefix - The prefix of the ID to generate. Optional.
 * @param separator - The separator between the prefix and the random part of the ID. Default: '-'.
 * @param size - The size of the random part of the ID to generate. Default: 16.
 */
export const createIdGenerator = ({
  prefix,
  size = 16,
  alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  separator = '-',
}: {
  prefix?: string;
  separator?: string;
  size?: number;
  alphabet?: string;
} = {}): IdGenerator => {
  const generator = () => {
    const alphabetLength = alphabet.length;
    const chars = new Array(size);
    for (let i = 0; i < size; i++) {
      chars[i] = alphabet[(Math.random() * alphabetLength) | 0];
    }
    return chars.join('');
  };

  if (prefix == null) {
    return generator;
  }

  // 检查前缀是否不是字母表的一部分（否则前缀检查可能会随机失败）
  if (alphabet.includes(separator)) {
    throw new InvalidArgumentError({
      argument: 'separator',
      message: `The separator "${separator}" must not be part of the alphabet "${alphabet}".`,
    });
  }

  return () => `${prefix}${separator}${generator()}`;
};

/**
 * 生成 ID 的函数。
 */
export type IdGenerator = () => string;

/**
 * 生成用于 ID 的 16 个字符的随机字符串。
 * 不加密安全。
 */
export const generateId = createIdGenerator();
