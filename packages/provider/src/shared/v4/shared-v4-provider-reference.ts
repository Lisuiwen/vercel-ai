/**
 * 提供程序名称到提供程序特定的文件标识符的映射。
 *
 * 提供者引用允许跨不同的文件进行识别
 * 通过存储每个提供商自己的内容，无需重新上传
 * 同一逻辑文件的标识符。
 *
 * ````ts
 * {
 *   "openai": "文件-abc123",
 *   “anthropic”：“文件-xyz789”
 * }
 * ```
 *
 * `type?: never` 约束排除任何具有 `type` 的对象
 * 属性，因此 `SharedV4ProviderReference` 不能与
 * 标记的文件数据形状（例如 `{ type: 'data', data }` 或
 * `{ type: 'reference', reference }`) 当两者出现在同一个联合体中时。
 */
export type SharedV4ProviderReference = Record<string, string> & {
  type?: never;
};
