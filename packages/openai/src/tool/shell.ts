import {
  createProviderDefinedToolFactoryWithOutputSchema,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import type { SharedV4ProviderReference } from '@ai-sdk/provider';
import { z } from 'zod/v4';

export const shellInputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      action: z.object({
        commands: z.array(z.string()),
        timeoutMs: z.number().optional(),
        maxOutputLength: z.number().optional(),
      }),
    }),
  ),
);

export const shellOutputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      output: z.array(
        z.object({
          stdout: z.string(),
          stderr: z.string(),
          outcome: z.discriminatedUnion('type', [
            z.object({ type: z.literal('timeout') }),
            z.object({ type: z.literal('exit'), exitCode: z.number() }),
          ]),
        }),
      ),
    }),
  ),
);

const shellSkillsSchema = z
  .array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('skillReference'),
        providerReference: z.record(z.string(), z.string()),
        version: z.string().optional(),
      }),
      z.object({
        type: z.literal('inline'),
        name: z.string(),
        description: z.string(),
        source: z.object({
          type: z.literal('base64'),
          mediaType: z.literal('application/zip'),
          data: z.string(),
        }),
      }),
    ]),
  )
  .optional();

export const shellArgsSchema = lazySchema(() =>
  zodSchema(
    z.object({
      environment: z
        .union([
          z.object({
            type: z.literal('containerAuto'),
            fileIds: z.array(z.string()).optional(),
            memoryLimit: z.enum(['1g', '4g', '16g', '64g']).optional(),
            networkPolicy: z
              .discriminatedUnion('type', [
                z.object({ type: z.literal('disabled') }),
                z.object({
                  type: z.literal('allowlist'),
                  allowedDomains: z.array(z.string()),
                  domainSecrets: z
                    .array(
                      z.object({
                        domain: z.string(),
                        name: z.string(),
                        value: z.string(),
                      }),
                    )
                    .optional(),
                }),
              ])
              .optional(),
            skills: shellSkillsSchema,
          }),
          z.object({
            type: z.literal('containerReference'),
            containerId: z.string(),
          }),
          z.object({
            type: z.literal('local').optional(),
            skills: z
              .array(
                z.object({
                  name: z.string(),
                  description: z.string(),
                  path: z.string(),
                }),
              )
              .optional(),
          }),
        ])
        .optional(),
    }),
  ),
);

type ShellArgs = {
  environment?:
    | {
        type: 'containerAuto';
        fileIds?: string[];
        memoryLimit?: '1g' | '4g' | '16g' | '64g';
        networkPolicy?:
          | { type: 'disabled' }
          | {
              type: 'allowlist';
              allowedDomains: string[];
              domainSecrets?: Array<{
                domain: string;
                name: string;
                value: string;
              }>;
            };
        skills?: Array<
          | {
              type: 'skillReference';
              providerReference: SharedV4ProviderReference;
              version?: string;
            }
          | {
              type: 'inline';
              name: string;
              description: string;
              source: {
                type: 'base64';
                mediaType: 'application/zip';
                data: string;
              };
            }
        >;
      }
    | {
        type: 'containerReference';
        containerId: string;
      }
    | {
        type?: 'local';
        skills?: Array<{
          name: string;
          description: string;
          path: string;
        }>;
      };
};

export const shell = createProviderDefinedToolFactoryWithOutputSchema<
  {
    /**
     * 包含要执行的命令的 Shell 工具操作。
     */
    action: {
      /**
       * 要执行的 shell 命令的列表。
       */
      commands: string[];

      /**
       * 命令的可选超时（以毫秒为单位）。
       */
      timeoutMs?: number;

      /**
       * 每个命令返回的可选最大字符数。
       */
      maxOutputLength?: number;
    };
  },
  {
    /**
     * shell 调用输出内容的数组。
     */
    output: Array<{
      /**
       * 命令的标准输出。
       */
      stdout: string;

      /**
       * 命令的标准错误。
       */
      stderr: string;

      /**
       * shell 执行的结果 - 超时或以代码退出。
       */
      outcome: { type: 'timeout' } | { type: 'exit'; exitCode: number };
    }>;
  },
  ShellArgs
>({
  id: 'openai.shell',
  inputSchema: shellInputSchema,
  outputSchema: shellOutputSchema,
});
