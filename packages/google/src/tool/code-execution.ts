import { createProviderExecutedToolFactory } from '@ai-sdk/provider-utils';
import { z } from 'zod/v4';

/**
 * 使模型能够生成并运行 Python 代码的工具。
 *
 * @note Ensure the selected model supports Code Execution.
 * 代码执行工具的多工具使用通常与 Gemini >=2 模型兼容。
 *
 * @see https://ai.google.dev/gemini-api/docs/code-execution (Google AI)
 * @see https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/code-execution-api (Vertex AI)
 */
export const codeExecution = createProviderExecutedToolFactory<
  {
    language: string;
    code: string;
  },
  {
    outcome: string;
    output: string;
  },
  {}
>({
  id: 'google.code_execution',
  inputSchema: z.object({
    language: z.string().describe('The programming language of the code.'),
    code: z.string().describe('The code to be executed.'),
  }),
  outputSchema: z.object({
    outcome: z
      .string()
      .describe('The outcome of the execution (e.g., "OUTCOME_OK").'),
    output: z.string().describe('The output from the code execution.'),
  }),
});
