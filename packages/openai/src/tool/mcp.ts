import {
  createProviderExecutedToolFactory,
  lazySchema,
  zodSchema,
} from '@ai-sdk/provider-utils';
import type { JSONValue } from '@ai-sdk/provider';
import { z } from 'zod/v4';

const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const mcpArgsSchema = lazySchema(() =>
  zodSchema(
    z
      .object({
        serverLabel: z.string(),
        allowedTools: z
          .union([
            z.array(z.string()),
            z.object({
              readOnly: z.boolean().optional(),
              toolNames: z.array(z.string()).optional(),
            }),
          ])
          .optional(),
        authorization: z.string().optional(),
        connectorId: z.string().optional(),
        headers: z.record(z.string(), z.string()).optional(),

        requireApproval: z
          .union([
            z.enum(['always', 'never']),
            z.object({
              never: z
                .object({
                  toolNames: z.array(z.string()).optional(),
                })
                .optional(),
            }),
          ])
          .optional(),
        serverDescription: z.string().optional(),
        serverUrl: z.string().optional(),
      })
      .refine(
        v => v.serverUrl != null || v.connectorId != null,
        'One of serverUrl or connectorId must be provided.',
      ),
  ),
);

const mcpInputSchema = lazySchema(() => zodSchema(z.object({})));

export const mcpOutputSchema = lazySchema(() =>
  zodSchema(
    z.object({
      type: z.literal('call'),
      serverLabel: z.string(),
      name: z.string(),
      arguments: z.string(),
      output: z.string().nullish(),
      error: z.union([z.string(), jsonValueSchema]).optional(),
    }),
  ),
);

type McpArgs = {
  /* * 此 MCP 服务器的标签，用于在工具调用中识别它。 */
  serverLabel: string;
  /* * 允许的工具名称或过滤器对象的列表。 */
  allowedTools?:
    | string[]
    | {
        readOnly?: boolean;
        toolNames?: string[];
      };
  /* * OAuth 访问令牌可与远程 MCP 服务器或连接器一起使用。 */
  authorization?: string;
  /* * 服务连接器的标识符。 */
  connectorId?: string;
  /* * 发送到 MCP 服务器的可选 HTTP 标头。 */
  headers?: Record<string, string>;
  /**
   * 哪些工具在执行前需要批准。
   */
  requireApproval?:
    | 'always'
    | 'never'
    | {
        never?: {
          toolNames?: string[];
        };
      };
  /* * MCP 服务器的可选描述。 */
  serverDescription?: string;
  /* * MCP 服务器的 URL。必须提供 serverUrl 或 ConnectorId 之一。 */
  serverUrl?: string;
};

export const mcpToolFactory = createProviderExecutedToolFactory<
  {},
  {
    type: 'call';
    serverLabel: string;
    name: string;
    arguments: string;
    output?: string | null;
    error?: JSONValue;
  },
  McpArgs
>({
  id: 'openai.mcp',
  inputSchema: mcpInputSchema,
  outputSchema: mcpOutputSchema,
});

export const mcp = (args: McpArgs) => mcpToolFactory(args);
