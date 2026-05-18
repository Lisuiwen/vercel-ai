import type { SharedV4ProviderMetadata } from '@ai-sdk/provider';
import { z } from 'zod/v4';
import { jsonValueSchema } from './json-value';

/**
 * 从提供者返回的其他特定于提供者的元数据。
 *
 * 这是启用特定于提供商的功能所必需的
 * 完全封装在提供者中。
 */
export type ProviderMetadata = SharedV4ProviderMetadata;

export const providerMetadataSchema: z.ZodType<ProviderMetadata> = z.record(
  z.string(),
  z.record(z.string(), jsonValueSchema.optional()),
);
