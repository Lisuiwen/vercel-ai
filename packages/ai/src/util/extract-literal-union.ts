/**
 * 如果“text”恰好是宽“string”类型，则没有字符串文字
 * 保留，因此解析为“从不”。
 *
 * 如果“text”是字符串文字或字符串文字的联合，则可以解决
 * 到那个字面联盟不变。
 *
 * 这在构建模板文字模型标识符时使用（例如
 * `"provider:modelId"`) 以便编辑者可以建议具体的 `modelId` 值
 * 当底层方法参数缩小时，同时回落到
 * 当参数仅时，通用 `"provider:${string}"` 样式重载
 * 输入为“字符串”。
 */
export type ExtractLiteralUnion<text> = text extends string
  ? string extends text
    ? never
    : text
  : never;
