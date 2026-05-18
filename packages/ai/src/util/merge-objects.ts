/**
 * 将两个对象深度合并在一起。
 * - “overrides”对象中的属性会覆盖具有相同键的“base”对象中的属性。
 * - 对于嵌套对象，合并以递归方式执行（深度合并）。
 * - 数组被替换，而不是合并。
 * - 原始值被替换。
 * - 如果 `base` 和 `overrides` 都未定义，则返回未定义。
 * - 如果“base”或“overrides”之一未定义，则返回另一个。
 *
 * @param base The target object to merge into
 * @param overrides The source object to merge from
 * @returns A new object with the merged properties, or undefined if both inputs are undefined
 */
export function mergeObjects<T extends object, U extends object>(
  base: T | undefined,
  overrides: U | undefined,
): (T & U) | T | U | undefined {
  // 如果两个输入均未定义，则返回 undefined
  if (base === undefined && overrides === undefined) {
    return undefined;
  }

  // 如果目标未定义，则返回源
  if (base === undefined) {
    return overrides;
  }

  // 如果源未定义，则返回目标
  if (overrides === undefined) {
    return base;
  }

  // 创建一个新对象以避免改变输入
  const result = { ...base } as T & U;

  // 迭代源对象中的所有键
  for (const key in overrides) {
    // 合并不受信任的输入时跳过原型污染键
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const overridesValue = overrides[key];

      // 如果覆盖值未定义则跳过
      if (overridesValue === undefined) continue;

      // 获取基值（如果存在）
      const baseValue =
        key in base ? base[key as unknown as keyof T] : undefined;

      // 检查两个值是否都是可以深度合并的对象
      const isSourceObject =
        overridesValue !== null &&
        typeof overridesValue === 'object' &&
        !Array.isArray(overridesValue) &&
        !(overridesValue instanceof Date) &&
        !(overridesValue instanceof RegExp);

      const isTargetObject =
        baseValue !== null &&
        baseValue !== undefined &&
        typeof baseValue === 'object' &&
        !Array.isArray(baseValue) &&
        !(baseValue instanceof Date) &&
        !(baseValue instanceof RegExp);

      // 如果两个值都是可合并对象，则递归合并它们
      if (isSourceObject && isTargetObject) {
        result[key as keyof (T & U)] = mergeObjects(
          baseValue as object,
          overridesValue as object,
        ) as any;
      } else {
        // 对于基元、数组或当一个值不是可合并对象时，
        // 只需用源值覆盖即可
        result[key as keyof (T & U)] = overridesValue as any;
      }
    }
  }

  return result;
}
