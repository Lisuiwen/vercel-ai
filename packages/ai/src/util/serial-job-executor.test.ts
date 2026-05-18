import { DelayedPromise } from '@ai-sdk/provider-utils';
import { describe, expect, it } from 'vitest';
import { SerialJobExecutor } from './serial-job-executor';

describe('SerialJobExecutor', () => {
  it('should execute a single job successfully', async () => {
    const executor = new SerialJobExecutor();
    const result = new DelayedPromise<string>();

    const jobPromise = executor.run(async () => {
      result.resolve('done');
    });

    await jobPromise;
    expect(await result.promise).toBe('done');
  });

  it('should execute multiple jobs in serial order', async () => {
    const executor = new SerialJobExecutor();
    const executionOrder: number[] = [];
    const job1Promise = new DelayedPromise<void>();
    const job2Promise = new DelayedPromise<void>();
    const job3Promise = new DelayedPromise<void>();

    // 启动所有作业
    const promise1 = executor.run(async () => {
      executionOrder.push(1);
      job1Promise.resolve();
    });

    const promise2 = executor.run(async () => {
      executionOrder.push(2);
      job2Promise.resolve();
    });

    const promise3 = executor.run(async () => {
      executionOrder.push(3);
      job3Promise.resolve();
    });

    // 等待所有作业完成
    await Promise.all([promise1, promise2, promise3]);

    // 验证执行顺序
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('should handle job errors correctly', async () => {
    const executor = new SerialJobExecutor();
    const error = new Error('test error');

    const promise = executor.run(async () => {
      throw error;
    });

    await expect(promise).rejects.toThrow(error);
  });

  it('should execute jobs one at a time', async () => {
    const executor = new SerialJobExecutor();
    let concurrentJobs = 0;
    let maxConcurrentJobs = 0;
    const job1 = new DelayedPromise<void>();
    const job2 = new DelayedPromise<void>();

    // 开始两份工作
    const promise1 = executor.run(async () => {
      concurrentJobs++;
      maxConcurrentJobs = Math.max(maxConcurrentJobs, concurrentJobs);
      await job1.promise;
      concurrentJobs--;
    });

    const promise2 = executor.run(async () => {
      concurrentJobs++;
      maxConcurrentJobs = Math.max(maxConcurrentJobs, concurrentJobs);
      await job2.promise;
      concurrentJobs--;
    });

    // 让两项工作继续进行并完成
    job1.resolve();
    job2.resolve();

    await Promise.all([promise1, promise2]);

    expect(maxConcurrentJobs).toBe(1);
  });

  it('should handle mixed success and failure jobs', async () => {
    const executor = new SerialJobExecutor();
    const results: string[] = [];
    const error = new Error('test error');

    // 对多个作业进行排队，成功/失败参差不齐
    const promise1 = executor.run(async () => {
      results.push('job1');
    });

    const promise2 = executor.run(async () => {
      throw error;
    });

    const promise3 = executor.run(async () => {
      results.push('job3');
    });

    // 第一份工作应该成功
    await promise1;
    expect(results).toEqual(['job1']);

    // 第二份工作应该会失败
    await expect(promise2).rejects.toThrow(error);

    // 第三项工作仍应执行并成功
    await promise3;
    expect(results).toEqual(['job1', 'job3']);
  });

  it('should handle concurrent calls to run()', async () => {
    const executor = new SerialJobExecutor();
    const executionOrder: number[] = [];
    const startOrder: number[] = [];

    // 创建延迟承诺来控制作业执行
    const job1 = new DelayedPromise<void>();
    const job2 = new DelayedPromise<void>();
    const job3 = new DelayedPromise<void>();

    // 同时启动所有作业
    const promises = [
      executor.run(async () => {
        startOrder.push(1);
        await job1.promise;
        executionOrder.push(1);
      }),
      executor.run(async () => {
        startOrder.push(2);
        await job2.promise;
        executionOrder.push(2);
      }),
      executor.run(async () => {
        startOrder.push(3);
        await job3.promise;
        executionOrder.push(3);
      }),
    ].map(p => p.catch(e => e));

    // 以相反的顺序解决作业以验证执行顺序是否得到维护
    job3.resolve();
    job2.resolve();
    job1.resolve();

    // 等待所有作业完成
    await Promise.all(promises);

    // 验证作业是否按照提交顺序排队
    expect(startOrder).toEqual([1, 2, 3]);
    // 验证作业是否按照排队顺序执行
    expect(executionOrder).toEqual([1, 2, 3]);
  });
});
