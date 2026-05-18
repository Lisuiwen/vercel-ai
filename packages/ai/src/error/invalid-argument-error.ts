import { AISDKError } from '@ai-sdk/provider';

const name = 'AI_InvalidArgumentError';
const marker = `vercel.ai.error.${name}`;
const symbol = Symbol.for(marker);

export class InvalidArgumentError extends AISDKError {
  private readonly [symbol] = true; // 在 isInstance 中使用

  readonly parameter: string;
  readonly value: unknown;

  constructor({
    parameter,
    value,
    message,
  }: {
    parameter: string;
    value: unknown;
    message: string;
  }) {
    super({
      name,
      message: `Invalid argument for parameter ${parameter}: ${message}`,
    });

    this.parameter = parameter;
    this.value = value;
  }

  static isInstance(error: unknown): error is InvalidArgumentError {
    return AISDKError.hasMarker(error, marker);
  }
}
