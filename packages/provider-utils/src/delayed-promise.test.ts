import { DelayedPromise } from './delayed-promise';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DelayedPromise', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve when accessed after resolution', async () => {
    const dp = new DelayedPromise<string>();
    dp.resolve('success');
    expect(await dp.promise).toBe('success');
  });

  it('should reject when accessed after rejection', async () => {
    const dp = new DelayedPromise<string>();
    const error = new Error('failure');
    dp.reject(error);
    await expect(dp.promise).rejects.toThrow('failure');
  });

  it('should resolve when accessed before resolution', async () => {
    const dp = new DelayedPromise<string>();
    const promise = dp.promise;
    dp.resolve('success');
    expect(await promise).toBe('success');
  });

  it('should reject when accessed before rejection', async () => {
    const dp = new DelayedPromise<string>();
    const promise = dp.promise;
    const error = new Error('failure');
    dp.reject(error);
    await expect(promise).rejects.toThrow('failure');
  });

  it('should maintain the resolved state after multiple accesses', async () => {
    const dp = new DelayedPromise<string>();
    dp.resolve('success');
    expect(await dp.promise).toBe('success');
    expect(await dp.promise).toBe('success');
  });

  it('should maintain the rejected state after multiple accesses', async () => {
    const dp = new DelayedPromise<string>();
    const error = new Error('failure');
    dp.reject(error);
    await expect(dp.promise).rejects.toThrow('failure');
    await expect(dp.promise).rejects.toThrow('failure');
  });

  it('should block until resolved when accessed before resolution', async () => {
    const dp = new DelayedPromise<string>();
    let resolved = false;

    // 在解决之前访问 Promise
    const promise = dp.promise.then(value => {
      resolved = true;
      return value;
    });

    // Promise 应该还没有解决
    expect(resolved).toBe(false);

    // 稍等一下以确保它确实被阻止
    await vi.advanceTimersByTimeAsync(10);
    expect(resolved).toBe(false);

    // 现在解决它
    dp.resolve('delayed-success');

    // 现在应该解决
    const result = await promise;
    expect(result).toBe('delayed-success');
    expect(resolved).toBe(true);
  });

  it('should block until rejected when accessed before rejection', async () => {
    const dp = new DelayedPromise<string>();
    let rejected = false;

    // 在拒绝之前访问承诺
    const promise = dp.promise.catch(error => {
      rejected = true;
      throw error;
    });

    // 承诺还不应该被拒绝
    expect(rejected).toBe(false);

    // 稍等一下以确保它确实被阻止
    await vi.advanceTimersByTimeAsync(10);
    expect(rejected).toBe(false);

    // 现在拒绝它
    const error = new Error('delayed-failure');
    dp.reject(error);

    // 现在应该拒绝
    await expect(promise).rejects.toThrow('delayed-failure');
    expect(rejected).toBe(true);
  });

  it('should resolve all pending promises when resolved after access', async () => {
    const dp = new DelayedPromise<string>();
    const results: string[] = [];

    // 在解决之前多次访问承诺
    const promise1 = dp.promise.then(value => {
      results.push(`first: ${value}`);
      return value;
    });

    const promise2 = dp.promise.then(value => {
      results.push(`second: ${value}`);
      return value;
    });

    // 两者都尚未解决
    expect(results).toHaveLength(0);

    // 等待以确保他们被阻止
    await vi.advanceTimersByTimeAsync(10);
    expect(results).toHaveLength(0);

    // 解决承诺
    dp.resolve('success');

    // 两者都应该解决
    await Promise.all([promise1, promise2]);
    expect(results).toHaveLength(2);
    expect(results).toContain('first: success');
    expect(results).toContain('second: success');
  });
});
