import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRuntimeEnvironmentUserAgent } from './get-runtime-environment-user-agent';

// 稳定 UA 字符串构造中使用的提供程序 utils 版本
vi.mock('./version', () => ({
  VERSION: '0.0.0-test',
}));

describe('getRuntimeEnvironmentUserAgent', () => {
  it('should return the correct user agent for browsers', () => {
    expect(
      getRuntimeEnvironmentUserAgent({
        window: true,
      }),
    ).toBe('runtime/browser');
  });

  it('should return the correct user agent for test', () => {
    expect(
      getRuntimeEnvironmentUserAgent({
        navigator: {
          userAgent: 'test',
        },
      }),
    ).toBe('runtime/test');
  });

  it('should return the correct user agent for Edge Runtime', () => {
    expect(
      getRuntimeEnvironmentUserAgent({
        EdgeRuntime: true,
      }),
    ).toBe('runtime/vercel-edge');
  });

  it('should return the correct user agent for Node.js', () => {
    expect(
      getRuntimeEnvironmentUserAgent({
        process: {
          versions: { node: 'test' },
          version: 'test',
        },
      }),
    ).toBe('runtime/node.js/test');
  });
});
