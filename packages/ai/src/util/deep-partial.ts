// 仅此文件的许可证：
//
// 麻省理工学院许可证
//
// 版权所有 (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
// 版权所有 (c) Vercel, Inc. (https://vercel.com)
//
// 特此免费向获得本软件及其相关副本的任何人授予许可
// 文档文件（“软件”），不受限制地处理软件，包括但不限于
// 使用、复制、修改、合并、发布、分发、再许可和/或出售软件副本的权利，以及
// 允许向其提供软件的人员这样做，但须满足以下条件：
//
// 上述版权声明和本许可声明应包含在所有副本或主要部分中
// 该软件的。
//
// 该软件按“原样”提供，不提供任何类型的明示或默示保证，包括但不限于
// 对适销性、特定用途的适用性和不侵权的保证。在任何情况下都不得
// 作者或版权所有者应对任何索赔、损害或其他责任负责，无论是出于
// 因本软件或使用或其他交易而产生、产生或与之相关的合同、侵权行为或其他行为
// 在软件中。

import type { FlexibleSchema, InferSchema } from '@ai-sdk/provider-utils';

/**
 * 从对象创建一个类型，并将所有键和嵌套键设置为可选。
 * 帮助器支持普通对象和模式（自动解析）。
 * 它总是递归到数组中。
 *
 * 摘自 [type-fest](https://github.com/sindresorhus/type-fest/tree/main) PartialDeep。
 */

export type DeepPartial<T> = T extends FlexibleSchema
  ? DeepPartialInternal<InferSchema<T>> // 首先解析模式以防止无限递归
  : DeepPartialInternal<T>;

type DeepPartialInternal<T> = T extends
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint
  | void
  | Date
  | RegExp
  | ((...arguments_: any[]) => unknown)
  | (new (...arguments_: any[]) => unknown)
  ? T
  : T extends Map<infer KeyType, infer ValueType>
    ? PartialMap<KeyType, ValueType>
    : T extends Set<infer ItemType>
      ? PartialSet<ItemType>
      : T extends ReadonlyMap<infer KeyType, infer ValueType>
        ? PartialReadonlyMap<KeyType, ValueType>
        : T extends ReadonlySet<infer ItemType>
          ? PartialReadonlySet<ItemType>
          : T extends object
            ? T extends ReadonlyArray<infer ItemType> // 测试阵列/元组，按照https://github.com/microsoft/TypeScript/issues/35156
              ? ItemType[] extends T // 专门测试数组（非元组）
                ? readonly ItemType[] extends T // 区分只读数组和可变数组
                  ? ReadonlyArray<DeepPartialInternal<ItemType | undefined>>
                  : Array<DeepPartialInternal<ItemType | undefined>>
                : PartialObject<T> // 元组行为正常
              : PartialObject<T>
            : unknown;

type PartialMap<KeyType, ValueType> = {} & Map<
  DeepPartialInternal<KeyType>,
  DeepPartialInternal<ValueType>
>;

type PartialSet<T> = {} & Set<DeepPartialInternal<T>>;

type PartialReadonlyMap<KeyType, ValueType> = {} & ReadonlyMap<
  DeepPartialInternal<KeyType>,
  DeepPartialInternal<ValueType>
>;

type PartialReadonlySet<T> = {} & ReadonlySet<DeepPartialInternal<T>>;

type PartialObject<ObjectType extends object> = {
  [KeyType in keyof ObjectType]?: DeepPartialInternal<ObjectType[KeyType]>;
};
