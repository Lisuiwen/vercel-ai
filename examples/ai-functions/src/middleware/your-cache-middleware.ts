import type { LanguageModelMiddleware } from 'ai';

const cache = new Map<string, any>();

export const yourCacheMiddleware: LanguageModelMiddleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = JSON.stringify(params);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = await doGenerate();

    cache.set(cacheKey, result);

    return result;
  },

  // 在这里您将实现流式传输的缓存逻辑
};
