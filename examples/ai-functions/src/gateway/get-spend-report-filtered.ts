import { gateway } from 'ai';
import { run } from '../lib/run';

// 查询花费由stream-text-with-tags示例生成的流量，
// 在一次调用中组合多个过滤器（模型、标签、每日细分）。
// 首先运行stream-text-with-tags.ts来生成匹配数据。

run(async () => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // 过滤到 Stream-text-with-tags.ts 使用的确切模型和标签
  console.log(
    `\n--- Filtered spend: claude-haiku-4.5 + reporting-test tag (${thirtyDaysAgo} to ${today}) ---\n`,
  );

  const report = await gateway.getSpendReport({
    startDate: thirtyDaysAgo,
    endDate: today,
    datePart: 'day',
    model: 'anthropic/claude-haiku-4.5',
    tags: ['feature:reporting-test'],
  });

  if (report.results.length === 0) {
    console.log(
      'No results found.',
      'Run stream-text-with-tags.ts first, then wait a few minutes for data to appear.',
    );
    return;
  }

  for (const row of report.results) {
    console.log(
      [
        row.day,
        `$${row.totalCost.toFixed(4)} cost`,
        `${row.requestCount ?? 0} requests`,
        `${row.inputTokens ?? 0} in / ${row.outputTokens ?? 0} out tokens`,
      ].join(' | '),
    );
  }

  // 按提供商分解相同标记的流量以查看路由
  console.log(`\n--- Same traffic grouped by provider ---\n`);

  const byProvider = await gateway.getSpendReport({
    startDate: thirtyDaysAgo,
    endDate: today,
    groupBy: 'provider',
    model: 'anthropic/claude-haiku-4.5',
    tags: ['feature:reporting-test'],
  });

  for (const row of byProvider.results) {
    console.log(
      `${row.provider}: $${row.totalCost.toFixed(4)} (${row.requestCount ?? 0} requests)`,
    );
  }
});
