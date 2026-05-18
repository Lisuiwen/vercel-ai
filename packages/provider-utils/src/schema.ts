import { TypeValidationError, type JSONSchema7 } from '@ai-sdk/provider';
import type {
  StandardSchemaV1,
  StandardJSONSchemaV1,
} from '@standard-schema/spec';
import type * as z3 from 'zod/v3';
import * as z4 from 'zod/v4';
import { addAdditionalPropertiesToJsonSchema } from './add-additional-properties-to-json-schema';
import { zod3ToJsonSchema } from './to-json-schema/zod3-to-json-schema';

/**
 * 用于标记模式，以便我们可以支持 Zod 和自定义模式。
 */
const schemaSymbol = Symbol.for('vercel.ai.schema');

export type ValidationResult<OBJECT> =
  | { success: true; value: OBJECT }
  | { success: false; error: Error };

export type Schema<OBJECT = unknown> = {
  /**
   * 用于标记模式，以便我们可以支持 Zod 和自定义模式。
   */
  [schemaSymbol]: true;

  /**
   * 用于推理的模式类型。
   */
  _type: OBJECT;

  /**
   * 选修的。验证值的结构是否与此模式匹配，
   * 如果存在，则返回该值的类型化版本。
   */
  readonly validate?: (
    value: unknown,
  ) => ValidationResult<OBJECT> | PromiseLike<ValidationResult<OBJECT>>;

  /**
   * 架构的 JSON 架构。它被传递给提供商。
   */
  readonly jsonSchema: JSONSchema7 | PromiseLike<JSONSchema7>;
};

/**
 * 创建具有延迟创建的架构。
 * 这对于减少库的启动时间很重要
 * 并避免初始化未使用的验证器。
 *
 * @param createValidator A function that creates a schema.
 * @returns A function that returns a schema.
 */
export function lazySchema<SCHEMA>(
  createSchema: () => Schema<SCHEMA>,
): LazySchema<SCHEMA> {
  // 缓存验证器以避免多次初始化
  let schema: Schema<SCHEMA> | undefined;
  return () => {
    if (schema == null) {
      schema = createSchema();
    }
    return schema;
  };
}

export type LazySchema<SCHEMA> = () => Schema<SCHEMA>;

export type ZodSchema<SCHEMA = any> =
  | z3.Schema<SCHEMA, z3.ZodTypeDef, any>
  | z4.core.$ZodType<SCHEMA, any>;

export type StandardSchema<SCHEMA = any> = StandardSchemaV1<unknown, SCHEMA> &
  StandardJSONSchemaV1<unknown, SCHEMA>;

export type FlexibleSchema<SCHEMA = any> =
  | Schema<SCHEMA>
  | LazySchema<SCHEMA>
  | ZodSchema<SCHEMA>
  | StandardSchema<SCHEMA>;

export type InferSchema<SCHEMA> =
  SCHEMA extends ZodSchema<infer T>
    ? T
    : SCHEMA extends StandardSchema<infer T>
      ? T
      : SCHEMA extends LazySchema<infer T>
        ? T
        : SCHEMA extends Schema<infer T>
          ? T
          : never;

/**
 * 使用 JSON 架构创建架构。
 *
 * @param jsonSchema The JSON Schema for the schema.
 * @param options.validate Optional. A validation function for the schema.
 */
export function jsonSchema<OBJECT = unknown>(
  jsonSchema:
    | JSONSchema7
    | PromiseLike<JSONSchema7>
    | (() => JSONSchema7 | PromiseLike<JSONSchema7>),
  {
    validate,
  }: {
    validate?: (
      value: unknown,
    ) => ValidationResult<OBJECT> | PromiseLike<ValidationResult<OBJECT>>;
  } = {},
): Schema<OBJECT> {
  return {
    [schemaSymbol]: true,
    _type: undefined as OBJECT, // 永远不应该直接使用
    get jsonSchema() {
      if (typeof jsonSchema === 'function') {
        jsonSchema = jsonSchema(); // 缓存函数结果
      }
      return jsonSchema;
    },
    validate,
  };
}

function isSchema(value: unknown): value is Schema {
  return (
    typeof value === 'object' &&
    value !== null &&
    schemaSymbol in value &&
    value[schemaSymbol] === true &&
    'jsonSchema' in value &&
    'validate' in value
  );
}

export function asSchema<OBJECT>(
  schema: FlexibleSchema<OBJECT> | undefined,
): Schema<OBJECT> {
  return schema == null
    ? jsonSchema({
        type: 'object',
        properties: {},
        additionalProperties: false,
      })
    : isSchema(schema)
      ? schema
      : '~standard' in schema
        ? schema['~standard'].vendor === 'zod'
          ? zodSchema(schema as ZodSchema<OBJECT>)
          : standardSchema(schema as StandardSchema<OBJECT>)
        : schema();
}

function standardSchema<OBJECT>(
  standardSchema: StandardSchema<OBJECT>,
): Schema<OBJECT> {
  return jsonSchema(
    () =>
      addAdditionalPropertiesToJsonSchema(
        standardSchema['~standard'].jsonSchema.input({
          target: 'draft-07',
        }) as JSONSchema7,
      ),
    {
      validate: async value => {
        const result = await standardSchema['~standard'].validate(value);
        return 'value' in result
          ? { success: true, value: result.value }
          : {
              success: false,
              error: new TypeValidationError({
                value,
                cause: result.issues,
              }),
            };
      },
    },
  );
}

export function zod3Schema<OBJECT>(
  zodSchema: z3.Schema<OBJECT, z3.ZodTypeDef, any>,
  options?: {
    /**
     * 启用对架构中引用的支持。
     * 这是递归模式所必需的，例如与“z.lazy”。
     * 但是，并非所有语言模型和提供程序都支持此类引用。
     * 默认为“假”。
     */
    useReferences?: boolean;
  },
): Schema<OBJECT> {
  // 默认为无引用（以支持 google 的 openapi 转换）
  const useReferences = options?.useReferences ?? false;

  return jsonSchema(
    // 推迟 json 模式创建以避免仅需要验证时不必要的计算
    () =>
      zod3ToJsonSchema(zodSchema, {
        $refStrategy: useReferences ? 'root' : 'none',
      }) as JSONSchema7,
    {
      validate: async value => {
        const result = await zodSchema.safeParseAsync(value);
        return result.success
          ? { success: true, value: result.data }
          : { success: false, error: result.error };
      },
    },
  );
}

export function zod4Schema<OBJECT>(
  zodSchema: z4.core.$ZodType<OBJECT, any>,
  options?: {
    /**
     * 启用对架构中引用的支持。
     * 这是递归模式所必需的，例如与“z.lazy”。
     * 但是，并非所有语言模型和提供程序都支持此类引用。
     * 默认为“假”。
     */
    useReferences?: boolean;
  },
): Schema<OBJECT> {
  // 默认为无引用（以支持 google 的 openapi 转换）
  const useReferences = options?.useReferences ?? false;

  return jsonSchema(
    // 推迟 json 模式创建以避免仅需要验证时不必要的计算
    () =>
      addAdditionalPropertiesToJsonSchema(
        z4.toJSONSchema(zodSchema, {
          target: 'draft-7',
          io: 'input',
          reused: useReferences ? 'ref' : 'inline',
        }) as JSONSchema7,
      ),
    {
      validate: async value => {
        const result = await z4.safeParseAsync(zodSchema, value);
        return result.success
          ? { success: true, value: result.data }
          : { success: false, error: result.error };
      },
    },
  );
}

export function isZod4Schema(
  zodSchema: z4.core.$ZodType<any, any> | z3.Schema<any, z3.ZodTypeDef, any>,
): zodSchema is z4.core.$ZodType<any, any> {
  // https://zod.dev/library-authors?id=how-to-support-zod-3-and-zod-4-simultaneously
  return '_zod' in zodSchema;
}

export function zodSchema<OBJECT>(
  zodSchema:
    | z4.core.$ZodType<OBJECT, any>
    | z3.Schema<OBJECT, z3.ZodTypeDef, any>,
  options?: {
    /**
     * 启用对架构中引用的支持。
     * 这是递归模式所必需的，例如与“z.lazy”。
     * 但是，并非所有语言模型和提供程序都支持此类引用。
     * 默认为“假”。
     */
    useReferences?: boolean;
  },
): Schema<OBJECT> {
  if (isZod4Schema(zodSchema)) {
    return zod4Schema(zodSchema, options);
  } else {
    return zod3Schema(zodSchema, options);
  }
}
