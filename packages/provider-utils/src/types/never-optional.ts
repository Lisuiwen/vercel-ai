// 0 扩展 1 和 N 检查任何
// [N] 扩展 [never] 检查从不
export type NeverOptional<N, T> = 0 extends 1 & N
  ? Partial<T>
  : [N] extends [never]
    ? Partial<Record<keyof T, undefined>>
    : T;
