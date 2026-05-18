import { describe, it, expect } from 'vitest';
import { resolve, type Resolvable } from './resolve';
describe('resolve', () => {
  // 测试原始值
  it('should resolve raw values', async () => {
    const value: Resolvable<number> = 42;
    expect(await resolve(value)).toBe(42);
  });

  it('should resolve raw objects', async () => {
    const value: Resolvable<object> = { foo: 'bar' };
    expect(await resolve(value)).toEqual({ foo: 'bar' });
  });

  // 测试承诺
  it('should resolve promises', async () => {
    const value: Resolvable<string> = Promise.resolve('hello');
    expect(await resolve(value)).toBe('hello');
  });

  it('should resolve rejected promises', async () => {
    const value: Resolvable<string> = Promise.reject(new Error('test error'));
    await expect(resolve(value)).rejects.toThrow('test error');
  });

  // 测试同步功能
  it('should resolve synchronous functions', async () => {
    const value: Resolvable<number> = () => 42;
    expect(await resolve(value)).toBe(42);
  });

  it('should resolve synchronous functions returning objects', async () => {
    const value: Resolvable<object> = () => ({ foo: 'bar' });
    expect(await resolve(value)).toEqual({ foo: 'bar' });
  });

  // 测试异步函数
  it('should resolve async functions', async () => {
    const value: Resolvable<string> = async () => 'hello';
    expect(await resolve(value)).toBe('hello');
  });

  it('should resolve async functions returning promises', async () => {
    const value: Resolvable<number> = () => Promise.resolve(42);
    expect(await resolve(value)).toBe(42);
  });

  it('should handle async function rejections', async () => {
    const value: Resolvable<string> = async () => {
      throw new Error('async error');
    };
    await expect(resolve(value)).rejects.toThrow('async error');
  });

  // Test edge cases
  it('should handle null', async () => {
    const value: Resolvable<null> = null;
    expect(await resolve(value)).toBe(null);
  });

  it('should handle undefined', async () => {
    const value: Resolvable<undefined> = undefined;
    expect(await resolve(value)).toBe(undefined);
  });

  // 使用复杂对象进行测试
  it('should resolve nested objects', async () => {
    const value: Resolvable<{ nested: { value: number } }> = {
      nested: { value: 42 },
    };
    expect(await resolve(value)).toEqual({ nested: { value: 42 } });
  });

  // 作为常见示例，测试解析标头中经常使用的对象
  describe('resolve headers', () => {
    it('should resolve header objects', async () => {
      const headers = { 'Content-Type': 'application/json' };
      expect(await resolve(headers)).toEqual(headers);
    });

    it('should resolve header functions', async () => {
      const headers = () => ({ Authorization: 'Bearer token' });
      expect(await resolve(headers)).toEqual({ Authorization: 'Bearer token' });
    });

    it('should resolve async header functions', async () => {
      const headers = async () => ({ 'X-Custom': 'value' });
      expect(await resolve(headers)).toEqual({ 'X-Custom': 'value' });
    });

    it('should resolve header promises', async () => {
      const headers = Promise.resolve({ Accept: 'application/json' });
      expect(await resolve(headers)).toEqual({ Accept: 'application/json' });
    });

    it('should call async header functions each time when resolved multiple times', async () => {
      let counter = 0;
      const headers = async () => ({ 'X-Request-Number': String(++counter) });

      // 多次解析相同的标头函数
      expect(await resolve(headers)).toEqual({ 'X-Request-Number': '1' });
      expect(await resolve(headers)).toEqual({ 'X-Request-Number': '2' });
      expect(await resolve(headers)).toEqual({ 'X-Request-Number': '3' });
    });
  });

  // 测试类型推断
  it('should maintain type information', async () => {
    interface User {
      id: number;
      name: string;
    }

    const userPromise: Resolvable<User> = Promise.resolve({
      id: 1,
      name: 'Test User',
    });

    const result = await resolve(userPromise);
    // TypeScript 应该将结果识别为用户类型
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test User');
  });
});
