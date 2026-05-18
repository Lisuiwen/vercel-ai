import { isUrlSupported } from './is-url-supported';
import { describe, expect, it } from 'vitest';

describe('isUrlSupported', () => {
  describe('when the model does not support any URLs', () => {
    it('should return false', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://example.com',
          supportedUrls: {},
        }),
      ).toBe(false);
    });
  });

  describe('when the model supports specific media types and URLs', () => {
    it('should return true for exact media type and exact URL match', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://example.com',
          supportedUrls: { 'text/plain': [/https:\/\/example\.com/] },
        }),
      ).toBe(true);
    });

    it('should return true for exact media type and regex URL match', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/png',
          url: 'https://images.example.com/cat.png',
          supportedUrls: {
            'image/png': [/https:\/\/images\.example\.com\/.+/],
          },
        }),
      ).toBe(true);
    });

    it('should return true for exact media type and one of multiple regex URLs match', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/png',
          url: 'https://another.com/img.png',
          supportedUrls: {
            'image/png': [
              /https:\/\/images\.example\.com\/.+/,
              /https:\/\/another\.com\/img\.png/,
            ],
          },
        }),
      ).toBe(true);
    });

    it('should return false for exact media type but URL mismatch', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://another.com',
          supportedUrls: { 'text/plain': [/https:\/\/example\.com/] },
        }),
      ).toBe(false);
    });

    it('should return false for URL match but media type mismatch', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/png', // 不同的媒体类型
          url: 'https://example.com',
          supportedUrls: { 'text/plain': [/https:\/\/example\.com/] },
        }),
      ).toBe(false);
    });
  });

  describe('when the model supports URLs via wildcard media type (*)', () => {
    it('should return true for wildcard media type and exact URL match', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://example.com',
          supportedUrls: { '*': [/https:\/\/example\.com/] },
        }),
      ).toBe(true);
    });

    it('should return true for wildcard media type and regex URL match', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/jpeg',
          url: 'https://images.example.com/dog.jpg',
          supportedUrls: { '*': [/https:\/\/images\.example\.com\/.+/] },
        }),
      ).toBe(true);
    });

    it('should return false for wildcard media type but URL mismatch', async () => {
      expect(
        isUrlSupported({
          mediaType: 'video/mp4',
          url: 'https://another.com',
          supportedUrls: { '*': [/https:\/\/example\.com/] },
        }),
      ).toBe(false);
    });
  });

  describe('when both specific and wildcard media types are defined', () => {
    const supportedUrls = {
      'text/plain': [/https:\/\/text\.com/],
      '*': [/https:\/\/any\.com/],
    };

    it('should return true if URL matches under specific media type', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://text.com',
          supportedUrls,
        }),
      ).toBe(true);
    });

    it('should return true if URL matches under wildcard media type even if specific exists', async () => {
      // 假设逻辑首先检查具体内容，然后回退到通配符
      expect(
        isUrlSupported({
          mediaType: 'text/plain', // 存在特定类型
          url: 'https://any.com', // 匹配通配符
          supportedUrls,
        }),
      ).toBe(true);
    });

    it('should return true if URL matches under wildcard for a non-specified media type', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/png', // 此类型没有具体条目
          url: 'https://any.com', // 匹配通配符
          supportedUrls,
        }),
      ).toBe(true);
    });

    it('should return false if URL matches neither specific nor wildcard', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://other.com',
          supportedUrls,
        }),
      ).toBe(false);
    });

    it('should return false if URL does not match wildcard for a non-specified media type', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/png',
          url: 'https://other.com',
          supportedUrls,
        }),
      ).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return true if an empty URL matches a pattern', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: '',
          supportedUrls: { 'text/plain': [/.*/] }, // 匹配任何字符串，包括空字符串
        }),
      ).toBe(true);
    });

    it('should return false if an empty URL does not match a pattern', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: '',
          supportedUrls: { 'text/plain': [/https:\/\/.+/] }, // 需要非空字符串
        }),
      ).toBe(false);
    });
  });

  describe('case sensitivity', () => {
    it('should be case-insensitive for media types', async () => {
      expect(
        isUrlSupported({
          mediaType: 'TEXT/PLAIN', // 大写
          url: 'https://example.com',
          supportedUrls: { 'text/plain': [/https:\/\/example\.com/] }, // 小写
        }),
      ).toBe(true);
    });

    it('should handle case-insensitive regex for URLs if specified', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://EXAMPLE.com/path', // 大写域
          supportedUrls: { 'text/plain': [/https:\/\/example\.com\/path/] },
        }),
      ).toBe(true);
    });

    it('should be case-insensitive for URL paths by default regex', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://example.com/PATH', // 大写路径
          supportedUrls: { 'text/plain': [/https:\/\/example\.com\/path/] }, // 正则表达式中的小写路径
        }),
      ).toBe(true);
    });
  });

  describe('wildcard subtypes in media types', () => {
    it('should return true for wildcard subtype match', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/png',
          url: 'https://example.com',
          supportedUrls: { 'image/*': [/https:\/\/example\.com/] },
        }),
      ).toBe(true);
    });

    it('should use full wildcard "*" if subtype wildcard is not matched or supported', async () => {
      expect(
        isUrlSupported({
          mediaType: 'image/png',
          url: 'https://any.com',
          supportedUrls: {
            'image/*': [/https:\/\/images\.com/], // 与网址不匹配
            '*': [/https:\/\/any\.com/], // 匹配网址
          },
        }),
      ).toBe(true);
    });
  });

  describe('top-level-only media types', () => {
    it('should match a `type/*` key for a top-level-only media type', () => {
      expect(
        isUrlSupported({
          mediaType: 'image',
          url: 'https://example.com/cat.png',
          supportedUrls: { 'image/*': [/https:\/\/example\.com\/.+/] },
        }),
      ).toBe(true);
    });

    it('should match the wildcard `*` key for a top-level-only media type', () => {
      expect(
        isUrlSupported({
          mediaType: 'image',
          url: 'https://example.com',
          supportedUrls: { '*': [/https:\/\/example\.com/] },
        }),
      ).toBe(true);
    });

    it('should NOT match a specific `type/subtype` key for a top-level-only media type', () => {
      expect(
        isUrlSupported({
          mediaType: 'image',
          url: 'https://example.com/cat.png',
          supportedUrls: { 'image/png': [/https:\/\/example\.com\/.+/] },
        }),
      ).toBe(false);
    });

    it('should NOT match a different top-level `type/*` key', () => {
      expect(
        isUrlSupported({
          mediaType: 'image',
          url: 'https://example.com/audio.mp3',
          supportedUrls: { 'audio/*': [/https:\/\/example\.com\/.+/] },
        }),
      ).toBe(false);
    });
  });

  describe('empty URL arrays for a media type', () => {
    it('should return false if the specific media type has an empty URL array', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://example.com',
          supportedUrls: { 'text/plain': [] },
        }),
      ).toBe(false);
    });

    it('should fall back to wildcard "*" if specific media type has empty array but wildcard matches', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://any.com',
          supportedUrls: {
            'text/plain': [],
            '*': [/https:\/\/any\.com/],
          },
        }),
      ).toBe(true);
    });

    it('should return false if specific media type has empty array and wildcard does not match', async () => {
      expect(
        isUrlSupported({
          mediaType: 'text/plain',
          url: 'https://another.com',
          supportedUrls: {
            'text/plain': [],
            '*': [/https:\/\/any\.com/],
          },
        }),
      ).toBe(false);
    });
  });
});
