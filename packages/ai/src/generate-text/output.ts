import {
  TypeValidationError,
  type JSONValue,
  type LanguageModelV4CallOptions,
} from '@ai-sdk/provider';
import {
  asSchema,
  resolve,
  safeParseJSON,
  safeValidateTypes,
  type FlexibleSchema,
} from '@ai-sdk/provider-utils';
import { NoObjectGeneratedError } from '../error/no-object-generated-error';
import type { FinishReason } from '../types/language-model';
import type { LanguageModelResponseMetadata } from '../types/language-model-response-metadata';
import type { LanguageModelUsage } from '../types/usage';
import type { DeepPartial } from '../util/deep-partial';
import { parsePartialJson } from '../util/parse-partial-json';
import type { EnrichedStreamPart } from './stream-text';

export interface Output<OUTPUT = any, PARTIAL = any, ELEMENT = any> {
  /**
   * 输出模式的名称。
   */
  name: string;

  /**
   * 用于模型的响应格式。
   */
  responseFormat: PromiseLike<LanguageModelV4CallOptions['responseFormat']>;

  /**
   * 解析模型的完整输出。
   */
  parseCompleteOutput(
    options: { text: string },
    context: {
      response: Omit<LanguageModelResponseMetadata, 'messages' | 'body'>;
      usage: LanguageModelUsage;
      finishReason: FinishReason;
    },
  ): Promise<OUTPUT>;

  /**
   * 解析模型的部分输出。
   */
  parsePartialOutput(options: {
    text: string;
  }): Promise<{ partial: PARTIAL } | undefined>;

  /**
   * 创建一个流转换，在完成时发出各个元素。
   */
  createElementStreamTransform():
    | TransformStream<EnrichedStreamPart<any, PARTIAL>, ELEMENT>
    | undefined;
}

/**
 * 文本生成的输出规范。
 * 这是生成纯文本的默认输出模式。
 *
 * @returns 用于生成文本的输出规范。
 */
export const text = (): Output<string, string, never> => ({
  name: 'text',
  responseFormat: Promise.resolve({ type: 'text' }),

  async parseCompleteOutput({ text }: { text: string }) {
    return text;
  },

  async parsePartialOutput({ text }: { text: string }) {
    return { partial: text };
  },

  createElementStreamTransform() {
    return undefined;
  },
});

/**
 * 使用模式生成类型化对象的输出规范。
 * 当模型生成文本响应时，它将返回与模式匹配的对象。
 *
 * @param schema - 要生成的对象的架构。
 * @param name - 应生成的输出的可选名称。一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
 * @param description - 应生成的输出的可选描述。一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
 *
 * @returns 用于生成具有指定模式的对象的输出规范。
 */
export const object = <OBJECT>({
  schema: inputSchema,
  name,
  description,
}: {
  schema: FlexibleSchema<OBJECT>;
  /**
   * 应生成的输出的可选名称。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
   */
  name?: string;
  /**
   * 应生成的输出的可选描述。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
   */
  description?: string;
}): Output<OBJECT, DeepPartial<OBJECT>, never> => {
  const schema = asSchema(inputSchema);

  return {
    name: 'object',

    responseFormat: resolve(schema.jsonSchema).then(jsonSchema => ({
      type: 'json' as const,
      schema: jsonSchema,
      ...(name != null && { name }),
      ...(description != null && { description }),
    })),

    async parseCompleteOutput(
      { text }: { text: string },
      context: {
        response: LanguageModelResponseMetadata;
        usage: LanguageModelUsage;
        finishReason: FinishReason;
      },
    ) {
      const parseResult = await safeParseJSON({ text });

      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: 'No object generated: could not parse the response.',
          cause: parseResult.error,
          text,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason,
        });
      }

      const validationResult = await safeValidateTypes({
        value: parseResult.value,
        schema,
      });

      if (!validationResult.success) {
        throw new NoObjectGeneratedError({
          message: 'No object generated: response did not match schema.',
          cause: validationResult.error,
          text,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason,
        });
      }

      return validationResult.value;
    },

    async parsePartialOutput({ text }: { text: string }) {
      const result = await parsePartialJson(text);

      switch (result.state) {
        case 'failed-parse':
        case 'undefined-input': {
          return undefined;
        }

        case 'repaired-parse':
        case 'successful-parse': {
          return {
            // 注意：目前尚未验证部分结果：
            partial: result.value as DeepPartial<OBJECT>,
          };
        }
      }
    },

    createElementStreamTransform() {
      return undefined;
    },
  };
};

/**
 * 数组生成的输出规范。
 * 当模型生成文本响应时，它将返回一个元素数组。
 *
 * @param element - 要生成的数组元素的架构。
 * @param name - 应生成的输出的可选名称。一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
 * @param description - 应生成的输出的可选描述。一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
 *
 * @returns 用于生成元素数组的输出规范。
 */
export const array = <ELEMENT>({
  element: inputElementSchema,
  name,
  description,
}: {
  element: FlexibleSchema<ELEMENT>;
  /**
   * 应生成的输出的可选名称。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
   */
  name?: string;
  /**
   * 应生成的输出的可选描述。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
   */
  description?: string;
}): Output<Array<ELEMENT>, Array<ELEMENT>, ELEMENT> => {
  const elementSchema = asSchema(inputElementSchema);

  return {
    name: 'array',

    // 元素描述 JSON 模式：
    responseFormat: resolve(elementSchema.jsonSchema).then(jsonSchema => {
      // 从 schema.jsonSchema 中删除$schema：
      const { $schema: _$schema, ...itemSchema } = jsonSchema;

      return {
        type: 'json' as const,
        schema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            elements: { type: 'array', items: itemSchema },
          },
          required: ['elements'],
          additionalProperties: false,
        },
        ...(name != null && { name }),
        ...(description != null && { description }),
      };
    }),

    async parseCompleteOutput(
      { text }: { text: string },
      context: {
        response: LanguageModelResponseMetadata;
        usage: LanguageModelUsage;
        finishReason: FinishReason;
      },
    ) {
      const parseResult = await safeParseJSON({ text });

      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: 'No object generated: could not parse the response.',
          cause: parseResult.error,
          text,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason,
        });
      }

      const outerValue = parseResult.value;

      if (
        outerValue == null ||
        typeof outerValue !== 'object' ||
        !('elements' in outerValue) ||
        !Array.isArray(outerValue.elements)
      ) {
        throw new NoObjectGeneratedError({
          message: 'No object generated: response did not match schema.',
          cause: new TypeValidationError({
            value: outerValue,
            cause: 'response must be an object with an elements array',
          }),
          text,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason,
        });
      }

      for (const element of outerValue.elements) {
        const validationResult = await safeValidateTypes({
          value: element,
          schema: elementSchema,
        });

        if (!validationResult.success) {
          throw new NoObjectGeneratedError({
            message: 'No object generated: response did not match schema.',
            cause: validationResult.error,
            text,
            response: context.response,
            usage: context.usage,
            finishReason: context.finishReason,
          });
        }
      }

      return outerValue.elements as Array<ELEMENT>;
    },

    async parsePartialOutput({ text }: { text: string }) {
      const result = await parsePartialJson(text);

      switch (result.state) {
        case 'failed-parse':
        case 'undefined-input': {
          return undefined;
        }

        case 'repaired-parse':
        case 'successful-parse': {
          const outerValue = result.value;

          // 没有可解析的元素数组
          if (
            outerValue == null ||
            typeof outerValue !== 'object' ||
            !('elements' in outerValue) ||
            !Array.isArray(outerValue.elements)
          ) {
            return undefined;
          }

          const rawElements =
            result.state === 'repaired-parse' && outerValue.elements.length > 0
              ? outerValue.elements.slice(0, -1)
              : outerValue.elements;

          const parsedElements: Array<ELEMENT> = [];
          for (const rawElement of rawElements) {
            const validationResult = await safeValidateTypes({
              value: rawElement,
              schema: elementSchema,
            });

            if (validationResult.success) {
              parsedElements.push(validationResult.value);
            }
          }

          return { partial: parsedElements };
        }
      }
    },

    createElementStreamTransform() {
      let publishedElements = 0;

      return new TransformStream<
        EnrichedStreamPart<any, Array<ELEMENT>>,
        ELEMENT
      >({
        transform({ partialOutput }, controller) {
          if (partialOutput != null) {
            // 只将尚未发布的新元素放入队列
            for (
              ;
              publishedElements < partialOutput.length;
              publishedElements++
            ) {
              controller.enqueue(partialOutput[publishedElements]);
            }
          }
        },
      });
    },
  };
};

/**
 * 选择生成的输出规范。
 * 当模型生成文本响应时，它将返回选择选项之一。
 *
 * @param options - 可用的选择。
 * @param name - 应生成的输出的可选名称。一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
 * @param description - 应生成的输出的可选描述。一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
 *
 * @returns 用于生成选择的输出规范。
 */
export const choice = <CHOICE extends string>({
  options: choiceOptions,
  name,
  description,
}: {
  options: Array<CHOICE>;
  /**
   * 应生成的输出的可选名称。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
   */
  name?: string;
  /**
   * 应生成的输出的可选描述。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
   */
  description?: string;
}): Output<CHOICE, CHOICE, never> => {
  return {
    name: 'choice',

    // 描述枚举的 JSON 模式：
    responseFormat: Promise.resolve({
      type: 'json',
      schema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          result: { type: 'string', enum: choiceOptions },
        },
        required: ['result'],
        additionalProperties: false,
      },
      ...(name != null && { name }),
      ...(description != null && { description }),
    } as const),

    async parseCompleteOutput(
      { text }: { text: string },
      context: {
        response: LanguageModelResponseMetadata;
        usage: LanguageModelUsage;
        finishReason: FinishReason;
      },
    ) {
      const parseResult = await safeParseJSON({ text });

      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: 'No object generated: could not parse the response.',
          cause: parseResult.error,
          text,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason,
        });
      }

      const outerValue = parseResult.value;

      if (
        outerValue == null ||
        typeof outerValue !== 'object' ||
        !('result' in outerValue) ||
        typeof outerValue.result !== 'string' ||
        !choiceOptions.includes(outerValue.result as any)
      ) {
        throw new NoObjectGeneratedError({
          message: 'No object generated: response did not match schema.',
          cause: new TypeValidationError({
            value: outerValue,
            cause: 'response must be an object that contains a choice value.',
          }),
          text,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason,
        });
      }

      return outerValue.result as CHOICE;
    },

    async parsePartialOutput({ text }: { text: string }) {
      const result = await parsePartialJson(text);

      switch (result.state) {
        case 'failed-parse':
        case 'undefined-input': {
          return undefined;
        }

        case 'repaired-parse':
        case 'successful-parse': {
          const outerValue = result.value;

          if (
            outerValue == null ||
            typeof outerValue !== 'object' ||
            !('result' in outerValue) ||
            typeof outerValue.result !== 'string'
          ) {
            return undefined;
          }

          // 潜在匹配的列表。
          const potentialMatches = choiceOptions.filter(choiceOption =>
            choiceOption.startsWith(outerValue.result as string),
          );

          if (result.state === 'successful-parse') {
            // 成功解析：精确选择值
            return potentialMatches.includes(outerValue.result as any)
              ? { partial: outerValue.result as CHOICE }
              : undefined;
          } else {
            // 修复解析：仅在明确时返回
            return potentialMatches.length === 1
              ? { partial: potentialMatches[0] as CHOICE }
              : undefined;
          }
        }
      }
    },

    createElementStreamTransform() {
      return undefined;
    },
  };
};

/**
 * 非构造JSON生成的输出规范。
 * 当模型生成文本响应时，会返回一个 JSON 对象。
 *
 * @param name - 应生成的输出的可选名称。一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
 * @param description - 应生成的输出的可选描述。一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
 *
 * @returns 用于生成 JSON 的输出规范。
 */
export const json = ({
  name,
  description,
}: {
  /**
   * 应生成的输出的可选名称。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式名称。
   */
  name?: string;
  /**
   * 应生成的输出的可选描述。
   * 一些提供者使用额外的法学硕士指导，例如通过工具或模式描述。
   */
  description?: string;
} = {}): Output<JSONValue, JSONValue, never> => {
  return {
    name: 'json',

    responseFormat: Promise.resolve({
      type: 'json' as const,
      ...(name != null && { name }),
      ...(description != null && { description }),
    }),

    async parseCompleteOutput(
      { text }: { text: string },
      context: {
        response: LanguageModelResponseMetadata;
        usage: LanguageModelUsage;
        finishReason: FinishReason;
      },
    ) {
      const parseResult = await safeParseJSON({ text });

      if (!parseResult.success) {
        throw new NoObjectGeneratedError({
          message: 'No object generated: could not parse the response.',
          cause: parseResult.error,
          text,
          response: context.response,
          usage: context.usage,
          finishReason: context.finishReason,
        });
      }

      return parseResult.value;
    },

    async parsePartialOutput({ text }: { text: string }) {
      const result = await parsePartialJson(text);

      switch (result.state) {
        case 'failed-parse':
        case 'undefined-input': {
          return undefined;
        }

        case 'repaired-parse':
        case 'successful-parse': {
          return result.value === undefined
            ? undefined
            : { partial: result.value };
        }
      }
    },

    createElementStreamTransform() {
      return undefined;
    },
  };
};
