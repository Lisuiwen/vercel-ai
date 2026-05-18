import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const advisor_20260301ArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      model: z.string(),
      maxUses: z.number().optional(),
      caching: z
        .object({
          type: z.literal('ephemeral'),
          ttl: z.union([z.literal('5m'), z.literal('1h')]),
        })
        .optional(),
    }),
  ),
);

export const advisor_20260301OutputSchema = lazySchema(() =>
  zodSchema(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('advisor_result'),
        text: z.string(),
      }),
      z.object({
        type: z.literal('advisor_redacted_result'),
        encryptedContent: z.string(),
      }),
      z.object({
        type: z.literal('advisor_tool_result_error'),
        errorCode: z.string(),
      }),
    ]),
  ),
);

const advisor_20260301InputSchema = lazySchema(() =>
  zodSchema(z.object({}).strict()),
);

const factory = createProviderExecutedToolFactory<
  // 输入始终为空：执行器发出带有空输入的 server_tool_use
  // 服务器根据完整的记录构建顾问的视图。
  {},
  | {
      type: 'advisor_result';

      /**
       * 来自顾问模型的明文建议。
       */
      text: string;
    }
  | {
      type: 'advisor_redacted_result';

      /**
       * 不透明、加密的建议。后续必须逐字往返
       * 轮流；服务器在呈现顾问程序时在服务器端对其进行解密
       * 建议进入执行者的提示。
       */
      encryptedContent: string;
    }
  | {
      type: 'advisor_tool_result_error';

      /**
       * 可用选项：`max_uses_exceeded`、`too_many_requests`、
       * `超载`、`prompt_too_long`、`execution_time_exceeded`、
       * `不可用`。
       */
      errorCode: string;
    },
  {
    /**
     * Advisor 模型 ID，例如“claude-opus-4-7”。在此计费
     * 模型的子推理率。
     *
     * 顾问必须至少与遗嘱执行人一样有能力；无效的
     * 对从 API 返回“400 invalid_request_error”。
     */
    model: string;

    /**
     * 单个请求中允许的顾问调用的最大数量。一旦
     * 执行者达到此上限，进一步的顾问调用返回
     * `advisor_tool_result_error` 和 `error_code: "max_uses_exceeded"` 和
     * 执行人在没有进一步建议的情况下继续进行。
     *
     * 这是每个请求的上限，而不是每个对话的上限。强制执行
     * 会话级别限制，计算顾问调用客户端；当你
     * 尽全力，从“工具”中删除顾问工具并删除所有内容
     * `advisor_tool_result` 会阻止您的消息历史记录（否则
     * API 返回“400 invalid_request_error”）。
     */
    maxUses?: number;

    /**
     * 跨呼叫启用座席自己的文字记录的提示缓存
     * 在一次谈话中。与内容块上的“cache_control”不同，这
     * 不是断点标记；它是一个开/关开关。服务器决定
     * 缓存边界在哪里。
     *
     * 当顾问程序处于运行状态时，缓存写入的成本高于读取节省的成本
     * 每次通话呼叫两次或更少；缓存甚至在
     * 大约三个顾问电话。为长代理循环启用它；保留它
     * 关闭短期任务。在对话中保持一致——
     * 切换会导致缓存未命中。
     */
    caching?: {
      type: 'ephemeral';
      ttl: '5m' | '1h';
    };
  }
>({
  id: 'anthropic.advisor_20260301',
  inputSchema: advisor_20260301InputSchema,
  outputSchema: advisor_20260301OutputSchema,
  supportsDeferredResults: true,
});

export const advisor_20260301 = (args: Parameters<typeof factory>[0]) => {
  return factory(args);
};
