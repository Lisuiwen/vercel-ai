/**
 * 来自模型的警告。
 *
 * 例如，某些功能不受支持或兼容性
 * 使用功能（这可能会导致次优结果）。
 */
export type SharedV3Warning =
  | {
      /**
       * 该模型不支持某个功能。
       */
      type: 'unsupported';

      /**
       * 不支持的功能。
       */
      feature: string;

      /**
       * 有关警告的其他详细信息。
       */
      details?: string;
    }
  | {
      /**
       * 使用的兼容性功能可能会导致次优结果。
       */
      type: 'compatibility';

      /**
       * 在兼容模式下使用的功能。
       */
      feature: string;

      /**
       * 有关警告的其他详细信息。
       */
      details?: string;
    }
  | {
      /**
       * 其他警告。
       */
      type: 'other';

      /**
       * 警告消息。
       */
      message: string;
    };
