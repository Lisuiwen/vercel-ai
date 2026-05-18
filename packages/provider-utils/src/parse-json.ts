import {
  JSONParseError,
  TypeValidationError,
  type JSONValue,
} from '@ai-sdk/provider';
import { secureJsonParse } from './secure-json-parse';
import { safeValidateTypes, validateTypes } from './validate-types';
import type { FlexibleSchema } from './schema';

/**
 * 将 JSON 字符串解析为未知对象。
 *
 * @param text - The JSON string to parse.
 * @returns {JSONValue} - The parsed JSON object.
 */
export async function parseJSON(options: {
  text: string;
  schema?: undefined;
}): Promise<JSONValue>;
/**
 * 使用提供的架构将 JSON 字符串解析为强类型对象。
 *
 * @template T - The type of the object to parse the JSON into.
 * @param {string} text - The JSON string to parse.
 * @param {Validator<T>} schema - The schema to use for parsing the JSON.
 * @returns {Promise<T>} - The parsed object.
 */
export async function parseJSON<T>(options: {
  text: string;
  schema: FlexibleSchema<T>;
}): Promise<T>;
export async function parseJSON<T>({
  text,
  schema,
}: {
  text: string;
  schema?: FlexibleSchema<T>;
}): Promise<T> {
  try {
    const value = secureJsonParse(text);

    if (schema == null) {
      return value;
    }

    return await validateTypes<T>({ value, schema });
  } catch (error) {
    if (
      JSONParseError.isInstance(error) ||
      TypeValidationError.isInstance(error)
    ) {
      throw error;
    }

    throw new JSONParseError({ text, cause: error });
  }
}

export type ParseResult<T> =
  | { success: true; value: T; rawValue: unknown }
  | {
      success: false;
      error: JSONParseError | TypeValidationError;
      rawValue: unknown;
    };

/**
 * 安全地解析 JSON 字符串并将结果作为“unknown”类型的对象返回。
 *
 * @param text - The JSON string to parse.
 * @returns {Promise<object>} Either an object with `success: true` and the parsed data, or an object with `success: false` and the error that occurred.
 */
export async function safeParseJSON(options: {
  text: string;
  schema?: undefined;
}): Promise<ParseResult<JSONValue>>;
/**
 * 使用提供的架构来验证对象，将 JSON 字符串安全地解析为强类型对象。
 *
 * @template T - The type of the object to parse the JSON into.
 * @param {string} text - The JSON string to parse.
 * @param {Validator<T>} schema - The schema to use for parsing the JSON.
 * @returns An object with either a `success` flag and the parsed and typed data, or a `success` flag and an error object.
 */
export async function safeParseJSON<T>(options: {
  text: string;
  schema: FlexibleSchema<T>;
}): Promise<ParseResult<T>>;
export async function safeParseJSON<T>({
  text,
  schema,
}: {
  text: string;
  schema?: FlexibleSchema<T>;
}): Promise<ParseResult<T>> {
  try {
    const value = secureJsonParse(text);

    if (schema == null) {
      return { success: true, value: value as T, rawValue: value };
    }

    return await safeValidateTypes<T>({ value, schema });
  } catch (error) {
    return {
      success: false,
      error: JSONParseError.isInstance(error)
        ? error
        : new JSONParseError({ text, cause: error }),
      rawValue: undefined,
    };
  }
}

export function isParsableJson(input: string): boolean {
  try {
    secureJsonParse(input);
    return true;
  } catch {
    return false;
  }
}
