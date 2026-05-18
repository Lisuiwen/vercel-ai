import {
  createProviderDefinedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

export const customArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      description: z.string().optional(),
      format: z
        .union([
          z.object({
            type: z.literal('grammar'),
            syntax: z.enum(['regex', 'lark']),
            definition: z.string(),
          }),
          z.object({
            type: z.literal('text'),
          }),
        ])
        .optional(),
    }),
  ),
);

const customInputSchema = lazySchema(() => zodSchema(z.string()));

export const customToolFactory = createProviderDefinedToolFactory<
  string,
  {
    /**
     * 该工具功能的可选描述。
     */
    description?: string;

    /**
     * 该工具的输出格式规范。
     * 省略不受约束的文本输出。
     */
    format?:
      | {
          type: 'grammar';
          syntax: 'regex' | 'lark';
          definition: string;
        }
      | {
          type: 'text';
        };
  }
>({
  id: 'openai.custom',
  inputSchema: customInputSchema,
});

export const customTool = (args: Parameters<typeof customToolFactory>[0]) =>
  customToolFactory(args);
