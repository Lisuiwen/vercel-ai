import type { SharedV3ProviderMetadata } from '../../shared/v3/shared-v3-provider-metadata';

/**
 * 已用作生成响应的输入的源。
 */
export type LanguageModelV3Source =
  | {
      type: 'source';

      /**
       * 源类型 - URL 源引用 Web 内容。
       */
      sourceType: 'url';

      /**
       * 源的 ID。
       */
      id: string;

      /**
       * 源的 URL。
       */
      url: string;

      /**
       * 来源的标题。
       */
      title?: string;

      /**
       * 源的其他提供者元数据。
       */
      providerMetadata?: SharedV3ProviderMetadata;
    }
  | {
      type: 'source';

      /**
       * 来源类型 - 文档来源参考文件/文档。
       */
      sourceType: 'document';

      /**
       * 源的 ID。
       */
      id: string;

      /**
       * 文档的 IANA 媒体类型（例如“application/pdf”）。
       */
      mediaType: string;

      /**
       * 文档的标题。
       */
      title: string;

      /**
       * Optional filename of the document.
       */
      filename?: string;

      /**
       * 源的其他提供者元数据。
       */
      providerMetadata?: SharedV3ProviderMetadata;
    };
