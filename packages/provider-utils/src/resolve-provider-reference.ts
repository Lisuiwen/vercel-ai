import {
  NoSuchProviderReferenceError,
  type SharedV4ProviderReference,
} from '@ai-sdk/provider';
/**
 * 解析提供者对特定于提供者的标识符的引用
 * 给定的提供者。如果提供者不是，则抛出“NoSuchProviderReferenceError”
 * 在参考映射中找到。
 */
export function resolveProviderReference({
  reference,
  provider,
}: {
  reference: SharedV4ProviderReference;
  provider: string;
}): string {
  const id = reference[provider];
  if (id != null) {
    return id;
  }

  throw new NoSuchProviderReferenceError({
    provider,
    reference,
  });
}
