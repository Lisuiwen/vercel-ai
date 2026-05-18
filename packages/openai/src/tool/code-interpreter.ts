import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const codeInterpreterInputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      code: z.string().nullish(),
      containerId: z.string(),
    }),
  ),
);

export const codeInterpreterOutputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      outputs: z
        .array(
          z.discriminatedUnion('type', [
            z.object({ type: z.literal('logs'), logs: z.string() }),
            z.object({ type: z.literal('image'), url: z.string() }),
          ]),
        )
        .nullish(),
    }),
  ),
);

export const codeInterpreterArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      container: z
        .union([
          z.string(),
          z.object({
            fileIds: z.array(z.string()).optional(),
          }),
        ])
        .optional(),
    }),
  ),
);

type CodeInterpreterArgs = {
  /**
   * 代码解释器容器。
   * 可以是容器ID
   * 或指定上传文件 ID 以供您的代码使用的对象。
   */
  container?: string | { fileIds?: string[] };
};

export const codeInterpreterToolFactory = createProviderExecutedToolFactory<
  {
    /**
     * 要运行的代码，如果不可用则为 null。
     */
    code?: string | null;

    /**
     * 用于运行代码的容器的 ID。
     */
    containerId: string;
  },
  {
    /**
     * 代码解释器生成的输出，例如日志或图像。
     * 如果没有可用的输出，则可以为 null。
     */
    outputs?: Array<
      | {
          type: 'logs';

          /**
           * 代码解释器输出的日志。
           */
          logs: string;
        }
      | {
          type: 'image';

          /**
           * 代码解释器输出的图像的 URL。
           */
          url: string;
        }
    > | null;
  },
  CodeInterpreterArgs
>({
  id: 'openai.code_interpreter',
  inputSchema: codeInterpreterInputSchema,
  outputSchema: codeInterpreterOutputSchema,
});

export const codeInterpreter = (
  args: CodeInterpreterArgs = {}, // 默认
) => {
  return codeInterpreterToolFactory(args);
};
