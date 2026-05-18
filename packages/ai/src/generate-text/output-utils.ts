import type { Output } from './output';

/**
 * 从输出规范推断完整的输出类型。
 */
export type InferCompleteOutput<OUTPUT extends Output> =
  OUTPUT extends Output<infer COMPLETE_OUTPUT, any, any>
    ? COMPLETE_OUTPUT
    : never;

/**
 * 从输出规范推断部分输出类型。
 */
export type InferPartialOutput<OUTPUT extends Output> =
  OUTPUT extends Output<any, infer PARTIAL_OUTPUT, any>
    ? PARTIAL_OUTPUT
    : never;

/**
 * 从数组输出规范推断元素类型。
 */
export type InferElementOutput<OUTPUT extends Output> =
  OUTPUT extends Output<any, any, infer ELEMENT> ? ELEMENT : never;
