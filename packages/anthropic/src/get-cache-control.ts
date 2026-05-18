import type {
  SharedV4Warning,
  SharedV4ProviderMetadata,
} from '@ai-sdk/provider';
import type { AnthropicCacheControl } from './anthropic-api';

// Anthropic 允许每个请求最多 4 个缓存断点
const MAX_CACHE_BREAKPOINTS = 4;

// 从提供者元数据中提取cache_control的辅助函数
// 允许同时使用cacheControl和cache_control以实现灵活性
function getCacheControl(
  providerMetadata: SharedV4ProviderMetadata | undefined,
): AnthropicCacheControl | undefined {
  const anthropic = providerMetadata?.anthropic;

  // 允许cacheControl 和cache_control：
  const cacheControlValue = anthropic?.cacheControl ?? anthropic?.cache_control;

  // 假设值的类型正确，则传递该值。
  // Anthropic API 将验证该值。
  return cacheControlValue as AnthropicCacheControl | undefined;
}

export class CacheControlValidator {
  private breakpointCount = 0;
  private warnings: SharedV4Warning[] = [];

  getCacheControl(
    providerMetadata: SharedV4ProviderMetadata | undefined,
    context: { type: string; canCache: boolean },
  ): AnthropicCacheControl | undefined {
    const cacheControlValue = getCacheControl(providerMetadata);

    if (!cacheControlValue) {
      return undefined;
    }

    // 验证在此上下文中是否允许使用cache_control
    if (!context.canCache) {
      this.warnings.push({
        type: 'unsupported',
        feature: 'cache_control on non-cacheable context',
        details: `cache_control cannot be set on ${context.type}. It will be ignored.`,
      });
      return undefined;
    }

    // 验证缓存断点限制
    this.breakpointCount++;
    if (this.breakpointCount > MAX_CACHE_BREAKPOINTS) {
      this.warnings.push({
        type: 'unsupported',
        feature: 'cacheControl breakpoint limit',
        details: `Maximum ${MAX_CACHE_BREAKPOINTS} cache breakpoints exceeded (found ${this.breakpointCount}). This breakpoint will be ignored.`,
      });
      return undefined;
    }

    return cacheControlValue;
  }

  getWarnings(): SharedV4Warning[] {
    return this.warnings;
  }
}
