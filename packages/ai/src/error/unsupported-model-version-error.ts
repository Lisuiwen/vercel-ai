import { AISDKError } from '@ai-sdk/provider';

/**
 * 使用版本不受支持的模型时引发的错误。
 */
export class UnsupportedModelVersionError extends AISDKError {
  readonly version: string;
  readonly provider: string;
  readonly modelId: string;

  constructor(options: { version: string; provider: string; modelId: string }) {
    super({
      name: 'AI_UnsupportedModelVersionError',
      message:
        `Unsupported model version ${options.version} for provider "${options.provider}" and model "${options.modelId}". ` +
        `AI SDK 5 only supports models that implement specification version "v2".`,
    });

    this.version = options.version;
    this.provider = options.provider;
    this.modelId = options.modelId;
  }
}
