import type { TranscriptionModelV2CallOptions } from './transcription-model-v2-call-options';

/**
 * 来自模型提供商对此调用的警告。呼叫将继续进行，但例如
 * 某些设置可能不受支持，这可能会导致结果不理想。
 */
export type TranscriptionModelV2CallWarning =
  | {
      type: 'unsupported-setting';
      setting: keyof TranscriptionModelV2CallOptions;
      details?: string;
    }
  | {
      type: 'other';
      message: string;
    };
