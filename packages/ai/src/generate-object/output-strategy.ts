import {
  isJSONArray,
  isJSONObject,
  TypeValidationError,
  UnsupportedFunctionalityError,
  type JSONObject,
  type JSONSchema7,
  type JSONValue,
} from '@ai-sdk/provider';
import {
  asSchema,
  safeValidateTypes,
  type FlexibleSchema,
  type Schema,
  type ValidationResult,
} from '@ai-sdk/provider-utils';
import { NoObjectGeneratedError } from '../error/no-object-generated-error';
import type {
  FinishReason,
  LanguageModelResponseMetadata,
  LanguageModelUsage,
} from '../types';
import {
  createAsyncIterableStream,
  type AsyncIterableStream,
} from '../util/async-iterable-stream';
import type { DeepPartial } from '../util/deep-partial';
import type { ObjectStreamPart } from './stream-object-result';

export interface OutputStrategy<PARTIAL, RESULT, ELEMENT_STREAM> {
  readonly type: 'object' | 'array' | 'enum' | 'no-schema';

  jsonSchema(): Promise<JSONSchema7 | undefined>;

  validatePartialResult({
    value,
    textDelta,
    isFinalDelta,
  }: {
    value: JSONValue;
    textDelta: string;
    isFirstDelta: boolean;
    isFinalDelta: boolean;
    latestObject: PARTIAL | undefined;
  }): Promise<
    ValidationResult<{
      partial: PARTIAL;
      textDelta: string;
    }>
  >;
  validateFinalResult(
    value: JSONValue | undefined,
    context: {
      text: string;
      response: Omit<LanguageModelResponseMetadata, 'messages'>;
      usage: LanguageModelUsage;
    },
  ): Promise<ValidationResult<RESULT>>;

  createElementStream(
    originalStream: ReadableStream<ObjectStreamPart<PARTIAL>>,
  ): ELEMENT_STREAM;
}

const noSchemaOutputStrategy: OutputStrategy<JSONValue, JSONValue, never> = {
  type: 'no-schema',
  jsonSchema: async () => undefined,

  async validatePartialResult({ value, textDelta }) {
    return { success: true, value: { partial: value, textDelta } };
  },

  async validateFinalResult(
    value: JSONValue | undefined,
    context: {
      text: string;
      response: LanguageModelResponseMetadata;
      usage: LanguageModelUsage;
      finishReason: FinishReason;
    },
  ): Promise<ValidationResult<JSONValue>> {
    return value === undefined
      ? {
          success: false,
          error: new NoObjectGeneratedError({
            message: 'No object generated: response did not match schema.',
            text: context.text,
            response: context.response,
            usage: context.usage,
            finishReason: context.finishReason,
          }),
        }
      : { success: true, value };
  },

  createElementStream() {
    throw new UnsupportedFunctionalityError({
      functionality: 'element streams in no-schema mode',
    });
  },
};

const objectOutputStrategy = <OBJECT>(
  schema: Schema<OBJECT>,
): OutputStrategy<DeepPartial<OBJECT>, OBJECT, never> => ({
  type: 'object',
  jsonSchema: async () => await schema.jsonSchema,

  async validatePartialResult({ value, textDelta }) {
    return {
      success: true,
      value: {
        // 注意：目前尚未验证部分结果：
        partial: value as DeepPartial<OBJECT>,
        textDelta,
      },
    };
  },

  async validateFinalResult(
    value: JSONValue | undefined,
  ): Promise<ValidationResult<OBJECT>> {
    return safeValidateTypes({ value, schema });
  },

  createElementStream() {
    throw new UnsupportedFunctionalityError({
      functionality: 'element streams in object mode',
    });
  },
});

const arrayOutputStrategy = <ELEMENT>(
  schema: Schema<ELEMENT>,
): OutputStrategy<ELEMENT[], ELEMENT[], AsyncIterableStream<ELEMENT>> => {
  return {
    type: 'array',

    // 包装在底层元素数组的对象中，因为大多数LLM不会
    // 能够直接生成数组：
    // 未来可能的优化：当模型支持语法引导生成时直接使用数组
    jsonSchema: async () => {
      // 从 schema.jsonSchema 中删除$schema：
      const { $schema: _$schema, ...itemSchema } = await schema.jsonSchema;

      return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          elements: { type: 'array', items: itemSchema },
        },
        required: ['elements'],
        additionalProperties: false,
      };
    },

    async validatePartialResult({
      value,
      latestObject,
      isFirstDelta,
      isFinalDelta,
    }) {
      // 检查该值是否是包含元素数组的对象：
      if (!isJSONObject(value) || !isJSONArray(value.elements)) {
        return {
          success: false,
          error: new TypeValidationError({
            value,
            cause: 'value must be an object that contains an array of elements',
          }),
        };
      }

      const inputArray = value.elements as Array<JSONObject>;
      const resultArray: Array<ELEMENT> = [];

      for (let i = 0; i < inputArray.length; i++) {
        const element = inputArray[i];
        const result = await safeValidateTypes({ value: element, schema });

        // 对最后处理的元素进行特殊处理：
        // 忽略解析或验证失败，因为它们表明
        // 最后一个元素不完整，不应包含在结果中，
        // 除非它是最终的增量
        if (i === inputArray.length - 1 && !isFinalDelta) {
          continue;
        }

        if (!result.success) {
          return result;
        }

        resultArray.push(result.value);
      }

      // 计算增量：
      const publishedElementCount = latestObject?.length ?? 0;

      let textDelta = '';

      if (isFirstDelta) {
        textDelta += '[';
      }

      if (publishedElementCount > 0) {
        textDelta += ',';
      }

      textDelta += resultArray
        .slice(publishedElementCount) // 只有新元素
        .map(element => JSON.stringify(element))
        .join(',');

      if (isFinalDelta) {
        textDelta += ']';
      }

      return {
        success: true,
        value: {
          partial: resultArray,
          textDelta,
        },
      };
    },

    async validateFinalResult(
      value: JSONValue | undefined,
    ): Promise<ValidationResult<Array<ELEMENT>>> {
      // 检查该值是否是包含元素数组的对象：
      if (!isJSONObject(value) || !isJSONArray(value.elements)) {
        return {
          success: false,
          error: new TypeValidationError({
            value,
            cause: 'value must be an object that contains an array of elements',
          }),
        };
      }

      const inputArray = value.elements as Array<JSONObject>;

      // 检查数组中每个元素的类型是否正确：
      for (const element of inputArray) {
        const result = await safeValidateTypes({ value: element, schema });
        if (!result.success) {
          return result;
        }
      }

      return { success: true, value: inputArray as Array<ELEMENT> };
    },

    createElementStream(
      originalStream: ReadableStream<ObjectStreamPart<ELEMENT[]>>,
    ) {
      let publishedElements = 0;

      return createAsyncIterableStream(
        originalStream.pipeThrough(
          new TransformStream<ObjectStreamPart<ELEMENT[]>, ELEMENT>({
            transform(chunk, controller) {
              switch (chunk.type) {
                case 'object': {
                  const array = chunk.object;

                  // 一一发布新元素：
                  for (
                    ;
                    publishedElements < array.length;
                    publishedElements++
                  ) {
                    controller.enqueue(array[publishedElements]);
                  }

                  break;
                }

                case 'text-delta':
                case 'finish':
                case 'error': // 抑制错误（用onError代替）
                  break;

                default: {
                  const _exhaustiveCheck: never = chunk;
                  throw new Error(
                    `Unsupported chunk type: ${_exhaustiveCheck}`,
                  );
                }
              }
            },
          }),
        ),
      );
    },
  };
};

const enumOutputStrategy = <ENUM extends string>(
  enumValues: Array<ENUM>,
): OutputStrategy<string, ENUM, never> => {
  return {
    type: 'enum',

    // 包装在包含结果的对象中，因为大多数法学硕士不会
    // 能够直接生成枚举值：
    // 未来可能的优化：当模型支持顶级枚举时直接使用枚举
    jsonSchema: async () => ({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        result: { type: 'string', enum: enumValues },
      },
      required: ['result'],
      additionalProperties: false,
    }),

    async validateFinalResult(
      value: JSONValue | undefined,
    ): Promise<ValidationResult<ENUM>> {
      // 检查该值是否是包含元素数组的对象：
      if (!isJSONObject(value) || typeof value.result !== 'string') {
        return {
          success: false,
          error: new TypeValidationError({
            value,
            cause:
              'value must be an object that contains a string in the "result" property.',
          }),
        };
      }

      const result = value.result as string;

      return enumValues.includes(result as ENUM)
        ? { success: true, value: result as ENUM }
        : {
            success: false,
            error: new TypeValidationError({
              value,
              cause: 'value must be a string in the enum',
            }),
          };
    },

    async validatePartialResult({ value, textDelta }) {
      if (!isJSONObject(value) || typeof value.result !== 'string') {
        return {
          success: false,
          error: new TypeValidationError({
            value,
            cause:
              'value must be an object that contains a string in the "result" property.',
          }),
        };
      }

      const result = value.result as string;
      const possibleEnumValues = enumValues.filter(enumValue =>
        enumValue.startsWith(result),
      );

      if (value.result.length === 0 || possibleEnumValues.length === 0) {
        return {
          success: false,
          error: new TypeValidationError({
            value,
            cause: 'value must be a string in the enum',
          }),
        };
      }

      return {
        success: true,
        value: {
          partial:
            possibleEnumValues.length > 1 ? result : possibleEnumValues[0],
          textDelta,
        },
      };
    },

    createElementStream() {
      // 枚举模式下无流式传输
      throw new UnsupportedFunctionalityError({
        functionality: 'element streams in enum mode',
      });
    },
  };
};

export function getOutputStrategy<SCHEMA>({
  output,
  schema,
  enumValues,
}: {
  output: 'object' | 'array' | 'enum' | 'no-schema';
  schema?: FlexibleSchema<SCHEMA>;
  enumValues?: Array<SCHEMA>;
}): OutputStrategy<any, any, any> {
  switch (output) {
    case 'object':
      return objectOutputStrategy(asSchema(schema!));
    case 'array':
      return arrayOutputStrategy(asSchema(schema!));
    case 'enum':
      return enumOutputStrategy(enumValues! as Array<string>);
    case 'no-schema':
      return noSchemaOutputStrategy;
    default: {
      const _exhaustiveCheck: never = output;
      throw new Error(`Unsupported output: ${_exhaustiveCheck}`);
    }
  }
}
