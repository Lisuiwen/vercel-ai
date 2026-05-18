import type { SharedV3ProviderMetadata } from '../../shared/v3/shared-v3-provider-metadata';
import type { SharedV3Warning } from '../../shared/v3/shared-v3-warning';
import type { LanguageModelV3File } from './language-model-v3-file';
import type { LanguageModelV3FinishReason } from './language-model-v3-finish-reason';
import type { LanguageModelV3ResponseMetadata } from './language-model-v3-response-metadata';
import type { LanguageModelV3Source } from './language-model-v3-source';
import type { LanguageModelV3ToolApprovalRequest } from './language-model-v3-tool-approval-request';
import type { LanguageModelV3ToolCall } from './language-model-v3-tool-call';
import type { LanguageModelV3ToolResult } from './language-model-v3-tool-result';
import type { LanguageModelV3Usage } from './language-model-v3-usage';

export type LanguageModelV3StreamPart =
  // 文本块：
  | {
      type: 'text-start';
      providerMetadata?: SharedV3ProviderMetadata;
      id: string;
    }
  | {
      type: 'text-delta';
      id: string;
      providerMetadata?: SharedV3ProviderMetadata;
      delta: string;
    }
  | {
      type: 'text-end';
      providerMetadata?: SharedV3ProviderMetadata;
      id: string;
    }

  // 推理块：
  | {
      type: 'reasoning-start';
      providerMetadata?: SharedV3ProviderMetadata;
      id: string;
    }
  | {
      type: 'reasoning-delta';
      id: string;
      providerMetadata?: SharedV3ProviderMetadata;
      delta: string;
    }
  | {
      type: 'reasoning-end';
      id: string;
      providerMetadata?: SharedV3ProviderMetadata;
    }

  // 工具调用和结果：
  | {
      type: 'tool-input-start';
      id: string;
      toolName: string;
      providerMetadata?: SharedV3ProviderMetadata;
      providerExecuted?: boolean;
      dynamic?: boolean;
      title?: string;
    }
  | {
      type: 'tool-input-delta';
      id: string;
      delta: string;
      providerMetadata?: SharedV3ProviderMetadata;
    }
  | {
      type: 'tool-input-end';
      id: string;
      providerMetadata?: SharedV3ProviderMetadata;
    }
  | LanguageModelV3ToolApprovalRequest
  | LanguageModelV3ToolCall
  | LanguageModelV3ToolResult

  // 文件和来源：
  | LanguageModelV3File
  | LanguageModelV3Source

  // 带有调用警告的流启动事件，例如不支持的设置：
  | {
      type: 'stream-start';
      warnings: Array<SharedV3Warning>;
    }

  // 响应的元数据。
  // 单独的流部分，以便一旦可用就可以发送。
  | ({ type: 'response-metadata' } & LanguageModelV3ResponseMetadata)

  // 流结束后可用的元数据：
  | {
      type: 'finish';
      usage: LanguageModelV3Usage;
      finishReason: LanguageModelV3FinishReason;
      providerMetadata?: SharedV3ProviderMetadata;
    }

  // 原始块（如果启用）
  | {
      type: 'raw';
      rawValue: unknown;
    }

  // 错误部分是流式传输的，允许出现多个错误
  | {
      type: 'error';
      error: unknown;
    };
