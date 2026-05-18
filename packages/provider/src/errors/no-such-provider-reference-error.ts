import type { SharedV4ProviderReference } from '../shared/v4/shared-v4-provider-reference';
import { AISDKError } from './ai-sdk-error';

const name = 'AI_NoSuchProviderReferenceError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

/**
 * 当由于指定的原因而无法解析提供者引用时抛出
 * 在提供程序引用映射中找不到提供程序。
 */
export class NoSuchProviderReferenceError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly provider: string;
  readonly reference: SharedV4ProviderReference;

  constructor({
    provider,
    reference,
    message = `No provider reference found for provider '${provider}'. Available providers: ${Object.keys(reference).join(', ')}`,
  }: {
    provider: string;
    reference: SharedV4ProviderReference;
    message?: string;
  }) {
    super({ name, message });
    this.provider = provider;
    this.reference = reference;
  }

  static isInstance(error: unknown): error is NoSuchProviderReferenceError {
    return AISDKError.hasMarker(error, marker);
  }
}
