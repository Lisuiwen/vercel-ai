import {
  convertToModelMessages,
  getStaticToolName,
  isStaticToolUIPart,
  type Tool,
  type ToolExecutionOptions,
  type ToolSet,
  type UIMessageStreamWriter,
} from 'ai';
import type { HumanInTheLoopUIMessage } from './types';

// 前后端共用的审批字符串
export const APPROVAL = {
  YES: 'Yes, confirmed.',
  NO: 'No, denied.',
} as const;

function isValidToolName<K extends PropertyKey, T extends object>(
  key: K,
  obj: T,
): key is K & keyof T {
  return key in obj;
}

/**
 * 处理需要人工输入的 tool 调用，在授权后执行 tool。
 *
 * @param options - 函数选项
 * @param options.tools - tool 名称到可能暴露 execute 函数的 Tool 实例的映射
 * @param options.writer - 用于将结果发回客户端的 UIMessageStream writer
 * @param options.messages - 待处理的消息数组
 * @param executionFunctions - tool 名称到 execute 函数的映射
 * @returns 解析为处理后消息的 Promise
 */
export async function processToolCalls<
  Tools extends ToolSet,
  ExecutableTools extends {
    [Tool in keyof Tools as Tools[Tool] extends { execute: Function }
      ? never
      : Tool]: Tools[Tool];
  },
>(
  {
    writer,
    messages,
  }: {
    tools: Tools; // 用于类型推断
    writer: UIMessageStreamWriter;
    messages: HumanInTheLoopUIMessage[]; // 重要：替换为你的消息类型
  },
  executeFunctions: {
    [K in keyof Tools & keyof ExecutableTools]?: (
      args: ExecutableTools[K] extends Tool<infer P> ? P : never,
      context: ToolExecutionOptions<{}>,
    ) => Promise<any>;
  },
): Promise<HumanInTheLoopUIMessage[]> {
  const lastMessage = messages[messages.length - 1];
  const parts = lastMessage.parts;
  if (!parts) return messages;

  const processedParts = await Promise.all(
    parts.map(async part => {
      // 仅处理 tool invocation parts
      if (!isStaticToolUIPart(part)) return part;

      const toolName = getStaticToolName(part);

      // 仅当 tool 有 execute 函数（需要确认）且处于 'result' 状态时继续
      if (!(toolName in executeFunctions) || part.state !== 'output-available')
        return part;

      let result;

      if (part.output === APPROVAL.YES) {
        // 获取 tool 并检查是否有 execute 函数。
        if (
          !isValidToolName(toolName, executeFunctions) ||
          part.state !== 'output-available'
        ) {
          return part;
        }

        const toolInstance = executeFunctions[toolName] as Tool['execute'];
        if (toolInstance) {
          result = await toolInstance(part.input, {
            messages: await convertToModelMessages(messages),
            toolCallId: part.toolCallId,
            context: {},
          });
        } else {
          result = 'Error: No execute function found on tool';
        }
      } else if (part.output === APPROVAL.NO) {
        result = 'Error: User denied access to tool execution';
      } else {
        // 对任何未处理的响应，返回原始 part。
        return part;
      }

      // 将更新后的 tool 结果转发给客户端。
      writer.write({
        type: 'tool-output-available',
        toolCallId: part.toolCallId,
        output: result,
      });

      // 返回带实际结果的更新后 toolInvocation。
      return {
        ...part,
        output: result,
      };
    }),
  );

  // 最后返回处理后的消息
  return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
}

export function getToolsRequiringConfirmation<
  T extends ToolSet,
  // E extends {
  //   [K in keyof T as T[K] extends { execute: Function } ? never : K]: T[K];
  // },
>(tools: T): string[] {
  return (Object.keys(tools) as (keyof T)[]).filter(key => {
    const maybeTool = tools[key];
    return typeof maybeTool.execute !== 'function';
  }) as string[];
}
