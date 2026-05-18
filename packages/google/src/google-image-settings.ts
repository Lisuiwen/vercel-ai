export type GoogleImageModelId =
  // Imagen 模型（使用 :predict API）
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-ultra-generate-001'
  | 'imagen-4.0-fast-generate-001'
  // Gemini 图像模型（技术上是多模态输出语言模型，使用 :generateContent API）
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview'
  | 'gemini-3.1-flash-image-preview'
  | (string & {});

export interface GoogleImageSettings {
  /**
   * 覆盖每次调用的最大图像数量（默认 4）
   */
  maxImagesPerCall?: number;
}
