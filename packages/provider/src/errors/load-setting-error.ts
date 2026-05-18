import { AISDKError } from './ai-sdk-error';

const name = 'AI_LoadSettingError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class LoadSettingError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  constructor({ message }: { message: string }) {
    super({ name, message });
  }

  static isInstance(error: unknown): error is LoadSettingError {
    return AISDKError.hasMarker(error, marker);
  }
}
