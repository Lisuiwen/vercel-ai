import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const codeExecution_20260120OutputSchema = lazySchema(() =>
  zodSchema(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('code_execution_result'),
        stdout: z.string(),
        stderr: z.string(),
        return_code: z.number(),
        content: z
          .array(
            z.object({
              type: z.literal('code_execution_output'),
              file_id: z.string(),
            }),
          )
          .optional()
          .default([]),
      }),
      z.object({
        type: z.literal('encrypted_code_execution_result'),
        encrypted_stdout: z.string(),
        stderr: z.string(),
        return_code: z.number(),
        content: z
          .array(
            z.object({
              type: z.literal('code_execution_output'),
              file_id: z.string(),
            }),
          )
          .optional()
          .default([]),
      }),
      z.object({
        type: z.literal('bash_code_execution_result'),
        content: z.array(
          z.object({
            type: z.literal('bash_code_execution_output'),
            file_id: z.string(),
          }),
        ),
        stdout: z.string(),
        stderr: z.string(),
        return_code: z.number(),
      }),
      z.object({
        type: z.literal('bash_code_execution_tool_result_error'),
        error_code: z.string(),
      }),
      z.object({
        type: z.literal('text_editor_code_execution_tool_result_error'),
        error_code: z.string(),
      }),
      z.object({
        type: z.literal('text_editor_code_execution_view_result'),
        content: z.string(),
        file_type: z.string(),
        num_lines: z.number().nullable(),
        start_line: z.number().nullable(),
        total_lines: z.number().nullable(),
      }),
      z.object({
        type: z.literal('text_editor_code_execution_create_result'),
        is_file_update: z.boolean(),
      }),
      z.object({
        type: z.literal('text_editor_code_execution_str_replace_result'),
        lines: z.array(z.string()).nullable(),
        new_lines: z.number().nullable(),
        new_start: z.number().nullable(),
        old_lines: z.number().nullable(),
        old_start: z.number().nullable(),
      }),
    ]),
  ),
);

export const codeExecution_20260120InputSchema = lazySchema(() =>
  zodSchema(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('programmatic-tool-call'),
        code: z.string(),
      }),
      z.object({
        type: z.literal('bash_code_execution'),
        command: z.string(),
      }),
      z.discriminatedUnion('command', [
        z.object({
          type: z.literal('text_editor_code_execution'),
          command: z.literal('view'),
          path: z.string(),
        }),
        z.object({
          type: z.literal('text_editor_code_execution'),
          command: z.literal('create'),
          path: z.string(),
          file_text: z.string().nullish(),
        }),
        z.object({
          type: z.literal('text_editor_code_execution'),
          command: z.literal('str_replace'),
          path: z.string(),
          old_str: z.string(),
          new_str: z.string(),
        }),
      ]),
    ]),
  ),
);

const factory = createProviderExecutedToolFactory<
  | {
      type: 'programmatic-tool-call';
      /**
       * 编程工具调用：code_execution时执行的Python代码
       * 与 allowedCallers 一起使用来触发客户端执行的工具。
       */
      code: string;
    }
  | {
      type: 'bash_code_execution';

      /**
       * 要执行的 shell 命令。
       */
      command: string;
    }
  | {
      type: 'text_editor_code_execution';
      command: 'view';

      /**
       * 要查看的文件的路径。
       */
      path: string;
    }
  | {
      type: 'text_editor_code_execution';
      command: 'create';

      /**
       * 要编辑的文件的路径。
       */
      path: string;

      /**
       * 要编辑的文件的文本。
       */
      file_text?: string | null;
    }
  | {
      type: 'text_editor_code_execution';
      command: 'str_replace';

      /**
       * 要编辑的文件的路径。
       */
      path: string;

      /**
       * 要替换的字符串。
       */
      old_str: string;

      /**
       * 用于替换旧字符串的新字符串。
       */
      new_str: string;
    },
  | {
      /**
       * 编程工具调用结果：code_execution运行代码时返回
       * 通过 allowedCallers 调用客户端执行的工具。
       */
      type: 'code_execution_result';

      /**
       * 成功执行的输出
       */
      stdout: string;

      /**
       * 如果执行失败则出现错误消息
       */
      stderr: string;

      /**
       * 0 表示成功，非 0 表示失败
       */
      return_code: number;

      /**
       * 输出文件 ID 列表
       */
      content: Array<{ type: 'code_execution_output'; file_id: string }>;
    }
  | {
      type: 'encrypted_code_execution_result';

      /**
       * 成功执行的加密输出
       */
      encrypted_stdout: string;

      /**
       * 如果执行失败则出现错误消息
       */
      stderr: string;

      /**
       * 0 表示成功，非 0 表示失败
       */
      return_code: number;

      /**
       * 输出文件 ID 列表
       */
      content: Array<{ type: 'code_execution_output'; file_id: string }>;
    }
  | {
      type: 'bash_code_execution_result';

      /**
       * 输出文件 ID 列表
       */
      content: Array<{
        type: 'bash_code_execution_output';
        file_id: string;
      }>;

      /**
       * 成功执行的输出
       */
      stdout: string;

      /**
       * 如果执行失败则出现错误消息
       */
      stderr: string;

      /**
       * 0 表示成功，非 0 表示失败
       */
      return_code: number;
    }
  | {
      type: 'bash_code_execution_tool_result_error';

      /**
       * 可用选项：invalid_tool_input、不可用、too_many_requests、
       * 执行时间超出，输出文件太大。
       */
      error_code: string;
    }
  | {
      type: 'text_editor_code_execution_tool_result_error';

      /**
       * 可用选项：invalid_tool_input、不可用、too_many_requests、
       * 执行时间超过，文件未找到。
       */
      error_code: string;
    }
  | {
      type: 'text_editor_code_execution_view_result';

      content: string;

      /**
       * 文件的类型。可用选项：文本、图像、pdf。
       */
      file_type: string;

      num_lines: number | null;
      start_line: number | null;
      total_lines: number | null;
    }
  | {
      type: 'text_editor_code_execution_create_result';

      is_file_update: boolean;
    }
  | {
      type: 'text_editor_code_execution_str_replace_result';

      lines: string[] | null;
      new_lines: number | null;
      new_start: number | null;
      old_lines: number | null;
      old_start: number | null;
    },
  {
    // 没有参数
  }
>({
  id: 'anthropic.code_execution_20260120',
  inputSchema: codeExecution_20260120InputSchema,
  outputSchema: codeExecution_20260120OutputSchema,
  supportsDeferredResults: true,
});

export const codeExecution_20260120 = (
  args: Parameters<typeof factory>[0] = {},
) => {
  return factory(args);
};
