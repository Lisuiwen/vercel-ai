import type {
  ZodDiscriminatedUnionDef,
  ZodLiteralDef,
  ZodTypeAny,
  ZodUnionDef,
} from 'zod/v3';
import { parseDef } from '../parse-def';
import type { JsonSchema7Type } from '../parse-types';
import type { Refs } from '../refs';

export const primitiveMappings = {
  ZodString: 'string',
  ZodNumber: 'number',
  ZodBigInt: 'integer',
  ZodBoolean: 'boolean',
  ZodNull: 'null',
} as const;
type ZodPrimitive = keyof typeof primitiveMappings;
type JsonSchema7Primitive =
  (typeof primitiveMappings)[keyof typeof primitiveMappings];

export type JsonSchema7UnionType =
  | JsonSchema7PrimitiveUnionType
  | JsonSchema7AnyOfType;

type JsonSchema7PrimitiveUnionType =
  | {
      type: JsonSchema7Primitive | JsonSchema7Primitive[];
    }
  | {
      type: JsonSchema7Primitive | JsonSchema7Primitive[];
      enum: (string | number | bigint | boolean | null)[];
    };

type JsonSchema7AnyOfType = {
  anyOf: JsonSchema7Type[];
};

export function parseUnionDef(
  def: ZodUnionDef | ZodDiscriminatedUnionDef<any, any>,
  refs: Refs,
): JsonSchema7PrimitiveUnionType | JsonSchema7AnyOfType | undefined {
  const options: readonly ZodTypeAny[] =
    def.options instanceof Map ? Array.from(def.options.values()) : def.options;

  // 该块尝试向前看一点，以使用数组类型而不是 anyOf 生成更好看的模式。
  if (
    options.every(
      x =>
        x._def.typeName in primitiveMappings &&
        (!x._def.checks || !x._def.checks.length),
    )
  ) {
    // union 中的所有类型都是原始类型并且缺乏检查，因此不妨压缩为 {type: [...]}

    const types = options.reduce((types: JsonSchema7Primitive[], x) => {
      const type = primitiveMappings[x._def.typeName as ZodPrimitive]; // 由于第 43 行，可以安全施放
      return type && !types.includes(type) ? [...types, type] : types;
    }, []);

    return {
      type: types.length > 1 ? types : types[0],
    };
  } else if (
    options.every(x => x._def.typeName === 'ZodLiteral' && !x.description)
  ) {
    // 所有选项文字

    const types = options.reduce(
      (acc: JsonSchema7Primitive[], x: { _def: ZodLiteralDef }) => {
        const type = typeof x._def.value;
        switch (type) {
          case 'string':
          case 'number':
          case 'boolean':
            return [...acc, type];
          case 'bigint':
            return [...acc, 'integer' as const];
          case 'object':
            if (x._def.value === null) return [...acc, 'null' as const];
          case 'symbol':
          case 'undefined':
          case 'function':
          default:
            return acc;
        }
      },
      [],
    );

    if (types.length === options.length) {
      // 所有文字都是原始的，就 null 而言可以被认为是原始的

      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce(
          (acc, x) => {
            return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
          },
          [] as (string | number | bigint | boolean | null)[],
        ),
      };
    }
  } else if (options.every(x => x._def.typeName === 'ZodEnum')) {
    return {
      type: 'string',
      enum: options.reduce(
        (acc: string[], x) => [
          ...acc,
          ...x._def.values.filter((x: string) => !acc.includes(x)),
        ],
        [],
      ),
    };
  }

  return asAnyOf(def, refs);
}

const asAnyOf = (
  def: ZodUnionDef | ZodDiscriminatedUnionDef<any, any>,
  refs: Refs,
): JsonSchema7PrimitiveUnionType | JsonSchema7AnyOfType | undefined => {
  const anyOf = (
    (def.options instanceof Map
      ? Array.from(def.options.values())
      : def.options) as any[]
  )
    .map((x, i) =>
      parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, 'anyOf', `${i}`],
      }),
    )
    .filter(
      (x): x is JsonSchema7Type =>
        !!x &&
        (!refs.strictUnions ||
          (typeof x === 'object' && Object.keys(x).length > 0)),
    );

  return anyOf.length ? { anyOf } : undefined;
};
