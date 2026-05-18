import { AISDKError } from './ai-sdk-error';

const name = 'AI_UnsupportedFunctionalityError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class UnsupportedFunctionalityError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly functionality: string;

  constructor({
    functionality,
    message = `'${functionality}' functionality not supported.`,
  }: {
    functionality: string;
    message?: string;
  }) {
    super({ name, message });
    this.functionality = functionality;
  }

  static isInstance(error: unknown): error is UnsupportedFunctionalityError {
    return AISDKError.hasMarker(error, marker);
  }
}
