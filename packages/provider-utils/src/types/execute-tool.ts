import { isAsyncIterable } from '../is-async-iterable';
import type { ExecutableTool } from './executable-tool';
import type { InferToolContext } from './infer-tool-context';
import type { InferToolInput } from './infer-tool-input';
import type { InferToolOutput } from './infer-tool-output';
import type { Tool } from './tool';
import type { ToolExecutionOptions } from './tool-execute-function';

/**
 * 执行工具函数并将其结果规范化为输出流。
 *
 * - 如果工具的“execute”函数返回“AsyncIterable”，则每个生成的值都会发出为
 *   `{ 类型：“初步”，输出 }`。迭代完成后，发出最后生成的值
 *   再次为`{ type: "final", output }`。
 * - 如果工具返回直接值或 Promise，则会生成单个 `{ type: "final", output }`。
 *
 * @param params.tool The tool whose `execute` function should be invoked.
 * @param params.input The input value to pass to the tool.
 * @param params.options Additional options for tool execution.
 * @yields A preliminary output for each streamed value, followed by a final output, or a single final
 * 非流工具的输出。
 */
export async function* executeTool<TOOL extends Tool>({
  tool,
  input,
  options,
}: {
  tool: ExecutableTool<TOOL>;
  input: InferToolInput<TOOL>;
  options: ToolExecutionOptions<InferToolContext<TOOL>>;
}): AsyncGenerator<
  | { type: 'preliminary'; output: InferToolOutput<TOOL> }
  | { type: 'final'; output: InferToolOutput<TOOL> }
> {
  const result = tool.execute(input, options);

  if (isAsyncIterable(result)) {
    let lastOutput: InferToolOutput<TOOL> | undefined;
    for await (const output of result) {
      lastOutput = output;
      yield { type: 'preliminary', output };
    }
    yield { type: 'final', output: lastOutput! };
  } else {
    yield { type: 'final', output: await result };
  }
}
