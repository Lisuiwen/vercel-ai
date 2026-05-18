import type { SharedV2ProviderMetadata } from '../../shared/v2/shared-v2-provider-metadata';
import type { LanguageModelV2CallWarning } from './language-model-v2-call-warning';
import type { LanguageModelV2File } from './language-model-v2-file';
import type { LanguageModelV2FinishReason } from './language-model-v2-finish-reason';
import type { LanguageModelV2ResponseMetadata } from './language-model-v2-response-metadata';
import type { LanguageModelV2Source } from './language-model-v2-source';
import type { LanguageModelV2ToolCall } from './language-model-v2-tool-call';
import type { LanguageModelV2ToolResult } from './language-model-v2-tool-result';
import type { LanguageModelV2Usage } from './language-model-v2-usage';

export type LanguageModelV2StreamPart =
  // 文本块：
  | {
      type: 'text-start';
      providerMetadata?: SharedV2ProviderMetadata;
      id: string;
    }
  | {
      type: 'text-delta';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
      delta: string;
    }
  | {
      type: 'text-end';
      providerMetadata?: SharedV2ProviderMetadata;
      id: string;
    }

  // 推理块：
  | {
      type: 'reasoning-start';
      providerMetadata?: SharedV2ProviderMetadata;
      id: string;
    }
  | {
      type: 'reasoning-delta';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
      delta: string;
    }
  | {
      type: 'reasoning-end';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }

  // 工具调用和结果：
  | {
      type: 'tool-input-start';
      id: string;
      toolName: string;
      providerMetadata?: SharedV2ProviderMetadata;
      providerExecuted?: boolean;
    }
  | {
      type: 'tool-input-delta';
      id: string;
      delta: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | {
      type: 'tool-input-end';
      id: string;
      providerMetadata?: SharedV2ProviderMetadata;
    }
  | LanguageModelV2ToolCall
  | LanguageModelV2ToolResult

  // 文件和来源：
  | LanguageModelV2File
  | LanguageModelV2Source

  // 带有调用警告的流启动事件，例如不支持的设置：
  | {
      type: 'stream-start';
      warnings: Array<LanguageModelV2CallWarning>;
    }

  // 响应的元数据。
  // 单独的流部分，以便一旦可用就可以发送。
  | ({ type: 'response-metadata' } & LanguageModelV2ResponseMetadata)

  // 流结束后可用的元数据：
  | {
      type: 'finish';
      usage: LanguageModelV2Usage;
      finishReason: LanguageModelV2FinishReason;
      providerMetadata?: SharedV2ProviderMetadata;
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
