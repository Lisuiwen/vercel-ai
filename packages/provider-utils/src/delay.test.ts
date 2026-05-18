import { delay } from './delay';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';

describe('delay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic delay functionality', () => {
    it('should resolve after the specified delay', async () => {
      const delayPromise = delay(1000);

      // 承诺不应立即解决
      let resolved = false;
      delayPromise.then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      // 将计时器提前小于延迟
      await vi.advanceTimersByTimeAsync(500);
      expect(resolved).toBe(false);

      // 提前计时器完成延迟
      await vi.advanceTimersByTimeAsync(500);
      expect(resolved).toBe(true);

      // 验证承诺是否解决
      await expect(delayPromise).resolves.toBeUndefined();
    });

    it('should resolve immediately when delayInMs is null', async () => {
      const delayPromise = delay(null);
      await expect(delayPromise).resolves.toBeUndefined();
    });

    it('should resolve immediately when delayInMs is undefined', async () => {
      const delayPromise = delay(undefined);
      await expect(delayPromise).resolves.toBeUndefined();
    });

    it('should resolve immediately when delayInMs is 0', async () => {
      const delayPromise = delay(0);

      // 即使延迟为0，也会使用setTimeout，因此我们需要提前计时器
      await vi.advanceTimersByTimeAsync(0);
      await expect(delayPromise).resolves.toBeUndefined();
    });
  });

  describe('abort signal functionality', () => {
    it('should reject immediately if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const delayPromise = delay(1000, { abortSignal: controller.signal });

      await expect(delayPromise).rejects.toThrow('Delay was aborted');
      expect(vi.getTimerCount()).toBe(0); // 不应设置计时器
    });

    it('should reject when signal is aborted during delay', async () => {
      const controller = new AbortController();
      const delayPromise = delay(1000, { abortSignal: controller.signal });

      // 部分提前时间
      await vi.advanceTimersByTimeAsync(500);

      // 中止信号
      controller.abort();

      await expect(delayPromise).rejects.toThrow('Delay was aborted');
    });

    it('should clean up timeout when aborted', async () => {
      const controller = new AbortController();
      const delayPromise = delay(1000, { abortSignal: controller.signal });

      expect(vi.getTimerCount()).toBe(1);

      controller.abort();

      try {
        await delayPromise;
      } catch {
        // 预计会抛出
      }

      expect(vi.getTimerCount()).toBe(0);
    });

    it('should clean up event listener when delay completes normally', async () => {
      const controller = new AbortController();
      const addEventListenerSpy = vi.spyOn(
        controller.signal,
        'addEventListener',
      );
      const removeEventListenerSpy = vi.spyOn(
        controller.signal,
        'removeEventListener',
      );

      const delayPromise = delay(1000, { abortSignal: controller.signal });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'abort',
        expect.any(Function),
      );

      await vi.advanceTimersByTimeAsync(1000);
      await delayPromise;

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'abort',
        expect.any(Function),
      );
    });

    it('should work without signal option', async () => {
      const delayPromise = delay(1000);

      await vi.advanceTimersByTimeAsync(1000);
      await expect(delayPromise).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should create proper DOMException for abort', async () => {
      const controller = new AbortController();
      controller.abort();

      const delayPromise = delay(1000, { abortSignal: controller.signal });

      try {
        await delayPromise;
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DOMException);
        expect((error as DOMException).message).toBe('Delay was aborted');
        expect((error as DOMException).name).toBe('AbortError');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very large delays', async () => {
      const delayPromise = delay(Number.MAX_SAFE_INTEGER);

      await vi.advanceTimersByTimeAsync(1000);
      let resolved = false;
      delayPromise.then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      // 快进完成
      await vi.advanceTimersByTimeAsync(1000);
      await expect(delayPromise).resolves.toBeUndefined();
    });

    it('should handle negative delays (treated as 0)', async () => {
      const delayPromise = delay(-100);

      vi.advanceTimersByTime(0);
      await expect(delayPromise).resolves.toBeUndefined();
    });

    it('should handle multiple delays simultaneously', async () => {
      const delay1 = delay(100);
      const delay2 = delay(200);
      const delay3 = delay(300);

      let resolved1 = false;
      let resolved2 = false;
      let resolved3 = false;

      delay1.then(() => {
        resolved1 = true;
      });
      delay2.then(() => {
        resolved2 = true;
      });
      delay3.then(() => {
        resolved3 = true;
      });

      // 100ms后，只有第一个应该解决
      await vi.advanceTimersByTimeAsync(100);
      expect(resolved1).toBe(true);
      expect(resolved2).toBe(false);
      expect(resolved3).toBe(false);

      // 200 毫秒后，前两个应该解决
      await vi.advanceTimersByTimeAsync(100);
      expect(resolved1).toBe(true);
      expect(resolved2).toBe(true);
      expect(resolved3).toBe(false);

      // 300 毫秒后，一切都应该解决
      await vi.advanceTimersByTimeAsync(100);
      expect(resolved1).toBe(true);
      expect(resolved2).toBe(true);
      expect(resolved3).toBe(true);
    });
  });
});
