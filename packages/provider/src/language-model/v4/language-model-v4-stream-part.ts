import type { SharedV4ProviderMetadata } from '../../shared/v4/shared-v4-provider-metadata';
import type { SharedV4Warning } from '../../shared/v4/shared-v4-warning';
import type { LanguageModelV4CustomContent } from './language-model-v4-custom-content';
import type { LanguageModelV4File } from './language-model-v4-file';
import type { LanguageModelV4FinishReason } from './language-model-v4-finish-reason';
import type { LanguageModelV4ReasoningFile } from './language-model-v4-reasoning-file';
import type { LanguageModelV4ResponseMetadata } from './language-model-v4-response-metadata';
import type { LanguageModelV4Source } from './language-model-v4-source';
import type { LanguageModelV4ToolApprovalRequest } from './language-model-v4-tool-approval-request';
import type { LanguageModelV4ToolCall } from './language-model-v4-tool-call';
import type { LanguageModelV4ToolResult } from './language-model-v4-tool-result';
import type { LanguageModelV4Usage } from './language-model-v4-usage';

export type LanguageModelV4StreamPart =
  // 文本块：
  | {
      type: 'text-start';
      providerMetadata?: SharedV4ProviderMetadata;
      id: string;
    }
  | {
      type: 'text-delta';
      id: string;
      providerMetadata?: SharedV4ProviderMetadata;
      delta: string;
    }
  | {
      type: 'text-end';
      providerMetadata?: SharedV4ProviderMetadata;
      id: string;
    }

  // 推理块：
  | {
      type: 'reasoning-start';
      providerMetadata?: SharedV4ProviderMetadata;
      id: string;
    }
  | {
      type: 'reasoning-delta';
      id: string;
      providerMetadata?: SharedV4ProviderMetadata;
      delta: string;
    }
  | {
      type: 'reasoning-end';
      id: string;
      providerMetadata?: SharedV4ProviderMetadata;
    }

  // 工具调用和结果：
  | {
      type: 'tool-input-start';
      id: string;
      toolName: string;
      providerMetadata?: SharedV4ProviderMetadata;
      providerExecuted?: boolean;
      dynamic?: boolean;
      title?: string;
    }
  | {
      type: 'tool-input-delta';
      id: string;
      delta: string;
      providerMetadata?: SharedV4ProviderMetadata;
    }
  | {
      type: 'tool-input-end';
      id: string;
      providerMetadata?: SharedV4ProviderMetadata;
    }
  | LanguageModelV4ToolApprovalRequest
  | LanguageModelV4ToolCall
  | LanguageModelV4ToolResult
  | LanguageModelV4CustomContent

  // 文件和来源：
  | LanguageModelV4File
  | LanguageModelV4ReasoningFile
  | LanguageModelV4Source

  // 带有调用警告的流启动事件，例如不支持的设置：
  | {
      type: 'stream-start';
      warnings: Array<SharedV4Warning>;
    }

  // 响应的元数据。
  // 单独的流部分，以便一旦可用就可以发送。
  | ({ type: 'response-metadata' } & LanguageModelV4ResponseMetadata)

  // 流结束后可用的元数据：
  | {
      type: 'finish';
      usage: LanguageModelV4Usage;
      finishReason: LanguageModelV4FinishReason;
      providerMetadata?: SharedV4ProviderMetadata;
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
