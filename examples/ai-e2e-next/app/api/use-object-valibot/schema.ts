import type { DeepPartial } from 'ai';
import * as v from 'valibot';
import { valibotSchema } from '@ai-sdk/valibot';

// 为 notifications 定义 schema
export const notificationSchema = valibotSchema(
  v.object({
    notifications: v.array(
      v.object({
        name: v.string(),
        message: v.string(),
        minutesAgo: v.number(),
      }),
    ),
  }),
);

// 为生成过程中的 partial notifications 定义类型
export type PartialNotification = DeepPartial<typeof notificationSchema>;
