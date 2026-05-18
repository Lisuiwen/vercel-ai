/**
 * 将输入对象转换为 FormData 以进行多部分/表单数据请求。
 *
 * 处理以下情况：
 * - 跳过“null”或“未定义”值
 * - 具有单个元素的数组作为单个值附加
 * - 具有多个元素的数组附加“[]”后缀（例如“image[]”）
 *   除非`useArrayBrackets`设置为`false`
 * - 所有其他值均直接附加
 *
 * @param input - The input object to convert. Use a generic type for type validation.
 * @param options - Optional configuration object.
 * @param options.useArrayBrackets - Whether to add `[]` suffix for multi-element arrays.
 *   默认为“true”。对于需要不带括号的重复键的 API，设置为“false”。
 * @returns A FormData object containing the input values.
 *
 * @example
 * ````ts
 * 输入我的输入 = {
 *   模型：字符串；
 *   提示：字符串；
 *   图像：Blob[]；
 * };
 *
 * const formData = ConvertToFormData<MyInput>({
 *   模型：'gpt-image-1'，
 *   提示：'一只猫'，
 *   图像：[blob1，blob2]，
 * });
 * ```
 */
export function convertToFormData<T extends Record<string, unknown>>(
  input: T,
  options: { useArrayBrackets?: boolean } = {},
): FormData {
  const { useArrayBrackets = true } = options;
  const formData = new FormData();

  for (const [key, value] of Object.entries(input)) {
    if (value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 1) {
        formData.append(key, value[0] as string | Blob);
        continue;
      }

      const arrayKey = useArrayBrackets ? `${key}[]` : key;
      for (const item of value) {
        formData.append(arrayKey, item as string | Blob);
      }
      continue;
    }

    formData.append(key, value as string | Blob);
  }

  return formData;
}
