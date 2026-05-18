import type { LanguageModelV2CallOptions } from './language-model-v2-call-options';
import type { LanguageModelV2FunctionTool } from './language-model-v2-function-tool';
import type { LanguageModelV2ProviderDefinedTool } from './language-model-v2-provider-defined-tool';

/**
 * 来自模型提供商对此调用的警告。呼叫将继续进行，但例如
 * 某些设置可能不受支持，这可能会导致结果不理想。
 */
export type LanguageModelV2CallWarning =
  | {
      type: 'unsupported-setting';
      setting: Omit<keyof LanguageModelV2CallOptions, 'prompt'>;
      details?: string;
    }
  | {
      type: 'unsupported-tool';
      tool: LanguageModelV2FunctionTool | LanguageModelV2ProviderDefinedTool;
      details?: string;
    }
  | {
      type: 'other';
      message: string;
    };
