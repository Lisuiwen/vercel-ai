import { describe, expectTypeOf, it } from 'vitest';
import { createGoogle } from '../google-provider';
import type { GoogleInteractionsAgentName } from './google-interactions-agent';

describe('GoogleInteractionsAgentName', () => {
  it('accepts the known deep-research agent names', () => {
    expectTypeOf<'deep-research-pro-preview-12-2025'>().toExtend<GoogleInteractionsAgentName>();
    expectTypeOf<'deep-research-preview-04-2026'>().toExtend<GoogleInteractionsAgentName>();
    expectTypeOf<'deep-research-max-preview-04-2026'>().toExtend<GoogleInteractionsAgentName>();
  });

  it('rejects arbitrary strings (compile-time error guard)', () => {
    /*
     * 如果类型再次放宽以包含 `(string & {})`，则此行
     * 将默默地开始编译。否定的“toExtend”保持严格
     * 工会诚实。
     */
    expectTypeOf<'definitely-not-an-agent'>().not.toExtend<GoogleInteractionsAgentName>();
    expectTypeOf<string>().not.toExtend<GoogleInteractionsAgentName>();
  });
});

describe('google.interactions agent factory typing', () => {
  const google = createGoogle({ apiKey: 'test' });

  it('accepts a known agent name', () => {
    google.interactions({ agent: 'deep-research-pro-preview-12-2025' });
  });

  it('rejects an unknown agent name', () => {
    // @ts-expect-error -“未知代理”不是有效的 GoogleInteractionsAgentName
    google.interactions({ agent: 'unknown-agent' });
  });
});
