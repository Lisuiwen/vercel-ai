import type { JSONSchema7Definition } from '@ai-sdk/provider';

/**
 * 将 JSON Schema 7 转换为 OpenAPI Schema 3.0
 */
export function convertJSONSchemaToOpenAPISchema(
  jsonSchema: JSONSchema7Definition | undefined,
  isRoot = true,
): unknown {
  // 处理空对象模式：在根处未定义，嵌套时保留
  if (jsonSchema == null) {
    return undefined;
  }

  if (isEmptyObjectSchema(jsonSchema)) {
    if (isRoot) {
      return undefined;
    }

    if (typeof jsonSchema === 'object' && jsonSchema.description) {
      return { type: 'object', description: jsonSchema.description };
    }
    return { type: 'object' };
  }

  if (typeof jsonSchema === 'boolean') {
    return { type: 'boolean', properties: {} };
  }

  const {
    type,
    description,
    required,
    properties,
    items,
    allOf,
    anyOf,
    oneOf,
    format,
    const: constValue,
    minLength,
    enum: enumValues,
  } = jsonSchema;

  const result: Record<string, unknown> = {};

  if (description) result.description = description;
  if (required) result.required = required;
  if (format) result.format = format;

  if (constValue !== undefined) {
    result.enum = [constValue];
  }

  // 手柄类型
  if (type) {
    if (Array.isArray(type)) {
      const hasNull = type.includes('null');
      const nonNullTypes = type.filter(t => t !== 'null');

      if (nonNullTypes.length === 0) {
        // 仅空类型
        result.type = 'null';
      } else {
        // 一个或多个非空类型：始终使用 anyOf
        result.anyOf = nonNullTypes.map(t => ({ type: t }));
        if (hasNull) {
          result.nullable = true;
        }
      }
    } else {
      result.type = type;
    }
  }

  // 句柄枚举
  if (enumValues !== undefined) {
    result.enum = enumValues;
  }

  if (properties != null) {
    result.properties = Object.entries(properties).reduce(
      (acc, [key, value]) => {
        acc[key] = convertJSONSchemaToOpenAPISchema(value, false);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  if (items) {
    result.items = Array.isArray(items)
      ? items.map(item => convertJSONSchemaToOpenAPISchema(item, false))
      : convertJSONSchemaToOpenAPISchema(items, false);
  }

  if (allOf) {
    result.allOf = allOf.map(item =>
      convertJSONSchemaToOpenAPISchema(item, false),
    );
  }
  if (anyOf) {
    // 处理 anyOf 包含 null 类型的情况
    if (
      anyOf.some(
        schema => typeof schema === 'object' && schema?.type === 'null',
      )
    ) {
      const nonNullSchemas = anyOf.filter(
        schema => !(typeof schema === 'object' && schema?.type === 'null'),
      );

      if (nonNullSchemas.length === 1) {
        // 如果只有一个非空模式，请将其转换并使其可为空
        const converted = convertJSONSchemaToOpenAPISchema(
          nonNullSchemas[0],
          false,
        );
        if (typeof converted === 'object') {
          result.nullable = true;
          Object.assign(result, converted);
        }
      } else {
        // 如果有多个非空模式，请将它们保留在 anyOf 中
        result.anyOf = nonNullSchemas.map(item =>
          convertJSONSchemaToOpenAPISchema(item, false),
        );
        result.nullable = true;
      }
    } else {
      result.anyOf = anyOf.map(item =>
        convertJSONSchemaToOpenAPISchema(item, false),
      );
    }
  }
  if (oneOf) {
    result.oneOf = oneOf.map(item =>
      convertJSONSchemaToOpenAPISchema(item, false),
    );
  }

  if (minLength !== undefined) {
    result.minLength = minLength;
  }

  return result;
}

function isEmptyObjectSchema(jsonSchema: JSONSchema7Definition): boolean {
  return (
    jsonSchema != null &&
    typeof jsonSchema === 'object' &&
    jsonSchema.type === 'object' &&
    (jsonSchema.properties == null ||
      Object.keys(jsonSchema.properties).length === 0) &&
    !jsonSchema.additionalProperties
  );
}
