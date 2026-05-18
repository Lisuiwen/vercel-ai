import type { InferUITools, UIDataTypes, UIMessage } from 'ai';
import type { tools } from './tools';

export type MyTools = InferUITools<typeof tools>;

// 使用 data part schema 定义自定义消息类型
export type HumanInTheLoopUIMessage = UIMessage<
  never, // metadata 类型
  UIDataTypes,
  MyTools
>;
