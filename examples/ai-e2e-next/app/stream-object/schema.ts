import type { DeepPartial } from 'ai';
import { z } from 'zod';

// 为 notifications 定义 schema
export const notificationSchema = z.object({
  notifications: z.array(
    z.object({
      name: z.string().describe('Name of a fictional person.'),
      message: z.string().describe('Message. Do not use emojis or links.'),
      minutesAgo: z.number(),
    }),
  ),
});

// 为生成过程中的 partial notifications 定义类型
export type PartialNotification = DeepPartial<typeof notificationSchema>;
