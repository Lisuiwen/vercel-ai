import {
  createProviderDefinedToolFactoryWithOutputSchema,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/**
 * apply_patch 输入的架构 - 模型发送的内容。
 *
 * 请参阅此处的官方规范：https://platform.openai.com/docs/api-reference/responses/create#responses_create-input-input_item_list-item-apply_patch_tool_call
 *
 */
export const applyPatchInputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      callId: z.string(),
      operation: z.discriminatedUnion('type', [
        z.object({
          type: z.literal('create_file'),
          path: z.string(),
          diff: z.string(),
        }),
        z.object({
          type: z.literal('delete_file'),
          path: z.string(),
        }),
        z.object({
          type: z.literal('update_file'),
          path: z.string(),
          diff: z.string(),
        }),
      ]),
    }),
  ),
);

/**
 * apply_patch 输出的架构 - 我们发回的内容。
 */
export const applyPatchOutputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      status: z.enum(['completed', 'failed']),
      output: z.string().optional(),
    }),
  ),
);

/**
 * 工具参数的架构（配置选项）。
 * apply_patch 工具不需要任何配置选项。
 */
export const applyPatchArgsSchema = lazySchema(() => zodSchema(z.object({})));

/**
 * apply_patch 操作的类型定义。
 */
export type ApplyPatchOperation =
  | {
      type: 'create_file';
      /**
       * 要创建的文件相对于工作区根目录的路径。
       */
      path: string;
      /**
       * 创建文件时要应用的统一差异内容。
       */
      diff: string;
    }
  | {
      type: 'delete_file';
      /**
       * 要删除的文件相对于工作区根目录的路径。
       */
      path: string;
    }
  | {
      type: 'update_file';
      /**
       * 要更新的文件相对于工作区根目录的路径。
       */
      path: string;
      /**
       * 统一差异内容以应用于现有文件。
       */
      diff: string;
    };

/**
 * apply_patch 工具可让 GPT-5.1 创建、更新和删除您的文件
 * 使用结构化差异的代码库。该模型不仅仅是建议编辑
 * 发出应用程序应用的补丁操作，然后返回报告，
 * 支持迭代、多步骤的代码编辑工作流程。
 *
 * 工具工厂创建一个提供商定义的工具，该工具：
 * - 从模型接收补丁操作（create_file、update_file、delete_file）
 * - 返回应用这些补丁的状态（完成或失败）
 *
 */
export const applyPatchToolFactory =
  createProviderDefinedToolFactoryWithOutputSchema<
    {
      /**
       * 模型生成的应用补丁工具调用的唯一 ID。
       */
      callId: string;

      /**
       * apply_patch 工具调用的具体创建、删除或更新指令。
       */
      operation: ApplyPatchOperation;
    },
    {
      /**
       * 应用补丁工具调用输出的状态。
       * -“已完成”：补丁已成功应用。
       * -“失败”：补丁应用失败。
       */
      status: 'completed' | 'failed';

      /**
       * 应用补丁工具中可选的人类可读日志文本
       * （例如，补丁结果或错误）。
       */
      output?: string;
    },
    // apply_patch 没有配置选项
    {}
  >({
    id: 'openai.apply_patch',
    inputSchema: applyPatchInputSchema,
    outputSchema: applyPatchOutputSchema,
  });

/**
 * apply_patch 工具可让 GPT-5.1 创建、更新和删除您的文件
 * 使用结构化差异的代码库。该模型不仅仅是建议编辑
 * 发出应用程序应用的补丁操作，然后返回报告，
 * 支持迭代、多步骤的代码编辑工作流程。
 */
export const applyPatch = applyPatchToolFactory;
