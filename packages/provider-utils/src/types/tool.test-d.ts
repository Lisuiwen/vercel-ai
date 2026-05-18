import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4';
import type { FlexibleSchema } from '../schema';
import type { ToolResultOutput } from './content-part';
import type { Context } from './context';
import type { ModelMessage } from './model-message';
import type { Experimental_Sandbox as Sandbox } from './sandbox';
import {
  dynamicTool,
  tool,
  type DynamicTool,
  type FunctionTool,
  type ProviderDefinedTool,
  type ProviderExecutedTool,
  type Tool,
} from './tool';
import type { ToolExecuteFunction } from './tool-execute-function';

describe('DynamicTool', () => {
  it('should include dynamic tools in the Tool union', () => {
    expectTypeOf<DynamicTool<{ number: number }, string, Context>>().toExtend<
      Tool<{ number: number }, string, Context>
    >();
  });

  it('should allow function-style properties', () => {
    const aTool: DynamicTool<{ location: string }, string, Context> = {
      type: 'dynamic',
      description: 'Get the weather for a location',
      strict: true,
      inputExamples: [{ input: { location: 'San Francisco' } }],
      inputSchema: z.object({ location: z.string() }),
      outputSchema: z.string(),
    };

    expectTypeOf(aTool.description).toEqualTypeOf<
      | string
      | ((options: {
          context: Context;
          experimental_sandbox?: Sandbox;
        }) => string)
      | undefined
    >();
    expectTypeOf(aTool.strict).toEqualTypeOf<boolean | undefined>();
    expectTypeOf(aTool.inputExamples).toEqualTypeOf<
      Array<{ input: { location: string } }> | undefined
    >();
  });

  it('should reject provider-only properties', () => {
    const _toolWithProviderId: DynamicTool<{ location: string }, never> = {
      type: 'dynamic',
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 动态工具不能有提供者 ID
      id: 'test.tool',
    };

    const _toolWithProviderExecutionFlag: DynamicTool<
      { location: string },
      never
    > = {
      type: 'dynamic',
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 动态工具无法由提供者执行
      isProviderExecuted: true,
    };

    const _toolWithProviderArgs: DynamicTool<{ location: string }, never> = {
      type: 'dynamic',
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 动态工具不能有提供者参数
      args: {},
    };

    const _toolWithDeferredResults: DynamicTool<{ location: string }, never> = {
      type: 'dynamic',
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 动态工具无法支持延迟的提供程序结果
      supportsDeferredResults: true,
    };
  });

  it('should create dynamic tools with the dynamic discriminator', () => {
    const aTool = dynamicTool({
      inputSchema: z.unknown(),
      execute: async input => input,
    });

    expectTypeOf(aTool).toEqualTypeOf<DynamicTool<unknown, unknown, Context>>();
    expectTypeOf(aTool.type).toEqualTypeOf<'dynamic'>();
  });
});

describe('ProviderDefinedTool', () => {
  it('should include provider-defined tools in the Tool union', () => {
    expectTypeOf<
      ProviderDefinedTool<{ number: number }, string, Context>
    >().toExtend<Tool<{ number: number }, string, Context>>();
  });

  it('should require provider-specific properties', () => {
    expectTypeOf<ProviderDefinedTool>()
      .toHaveProperty('type')
      .toEqualTypeOf<'provider'>();
    expectTypeOf<ProviderDefinedTool>()
      .toHaveProperty('id')
      .toEqualTypeOf<`${string}.${string}`>();
    expectTypeOf<ProviderDefinedTool>()
      .toHaveProperty('isProviderExecuted')
      .toEqualTypeOf<false>();
    expectTypeOf<ProviderDefinedTool>()
      .toHaveProperty('args')
      .toEqualTypeOf<Record<string, unknown>>();
  });

  it('should allow user execution or an output schema', () => {
    const toolWithExecute: ProviderDefinedTool<
      { location: string },
      string,
      Context
    > = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      execute: async () => 'sunny',
    };

    const toolWithOutputSchema: ProviderDefinedTool<
      { location: string },
      string,
      Context
    > = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      outputSchema: z.string(),
    };

    expectTypeOf(toolWithExecute.execute).not.toEqualTypeOf<undefined>();
    expectTypeOf(toolWithOutputSchema.outputSchema).toEqualTypeOf<
      FlexibleSchema<string>
    >();
  });

  it('should reject function-only properties and invalid provider metadata', () => {
    const _toolWithDescription: ProviderDefinedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 提供程序工具不能有功能描述
      description: 'Get weather',
    };

    const _toolWithStrict: ProviderDefinedTool<{ location: string }, never> = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 提供程序工具不能有严格模式
      strict: true,
    };

    const _toolWithInputExamples: ProviderDefinedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 提供程序工具不能有输入示例
      inputExamples: [{ input: { location: 'San Francisco' } }],
    };

    const _toolWithInvalidId: ProviderDefinedTool<{ location: string }, never> =
      {
        type: 'provider',
        // @ts-expect-error 提供程序工具 ID 必须遵循provider.tool 格式
        id: 'tool',
        isProviderExecuted: false,
        args: {},
        inputSchema: z.object({ location: z.string() }),
      };

    const _toolWithProviderExecutedFlag: ProviderDefinedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      id: 'test.tool',
      // @ts-expect-error 提供商定义的工具未由提供商执行
      isProviderExecuted: true,
      args: {},
      inputSchema: z.object({ location: z.string() }),
    };

    const _toolWithDeferredResults: ProviderDefinedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 只有提供者执行的工具才能支持延迟结果
      supportsDeferredResults: true,
    };
  });

  it('should require an output schema when there is no execute function', () => {
    // 具有具体输出的@ts-expect-error工具需要outputSchema或execute
    const _tool: ProviderDefinedTool<{ location: string }, string, Context> = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
    };
  });
});

describe('ProviderExecutedTool', () => {
  it('should include provider-executed tools in the Tool union', () => {
    expectTypeOf<
      ProviderExecutedTool<{ number: number }, string, Context>
    >().toExtend<Tool<{ number: number }, string, Context>>();
  });

  it('should require provider-specific properties', () => {
    expectTypeOf<ProviderExecutedTool>()
      .toHaveProperty('type')
      .toEqualTypeOf<'provider'>();
    expectTypeOf<ProviderExecutedTool>()
      .toHaveProperty('id')
      .toEqualTypeOf<`${string}.${string}`>();
    expectTypeOf<ProviderExecutedTool>()
      .toHaveProperty('isProviderExecuted')
      .toEqualTypeOf<true>();
    expectTypeOf<ProviderExecutedTool>()
      .toHaveProperty('args')
      .toEqualTypeOf<Record<string, unknown>>();
  });

  it('should allow deferred result support', () => {
    const aTool: ProviderExecutedTool<{ location: string }, string, Context> = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: true,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      outputSchema: z.string(),
      supportsDeferredResults: true,
    };

    expectTypeOf(aTool.supportsDeferredResults).toEqualTypeOf<
      boolean | undefined
    >();
  });

  it('should reject function-only properties and invalid provider metadata', () => {
    const _toolWithDescription: ProviderExecutedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: true,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 提供程序工具不能有功能描述
      description: 'Get weather',
    };

    const _toolWithStrict: ProviderExecutedTool<{ location: string }, never> = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: true,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 提供程序工具不能有严格模式
      strict: true,
    };

    const _toolWithInputExamples: ProviderExecutedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: true,
      args: {},
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 提供程序工具不能有输入示例
      inputExamples: [{ input: { location: 'San Francisco' } }],
    };

    const _toolWithInvalidId: ProviderExecutedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      // @ts-expect-error 提供程序工具 ID 必须遵循provider.tool 格式
      id: 'tool',
      isProviderExecuted: true,
      args: {},
      inputSchema: z.object({ location: z.string() }),
    };

    const _toolWithoutProviderExecutedFlag: ProviderExecutedTool<
      { location: string },
      never
    > = {
      type: 'provider',
      id: 'test.tool',
      // @ts-expect-error 提供商执行的工具必须由提供商执行
      isProviderExecuted: false,
      args: {},
      inputSchema: z.object({ location: z.string() }),
    };
  });

  it('should require an output schema when there is no execute function', () => {
    // 具有具体输出的@ts-expect-error工具需要outputSchema或execute
    const _tool: ProviderExecutedTool<{ location: string }, string, Context> = {
      type: 'provider',
      id: 'test.tool',
      isProviderExecuted: true,
      args: {},
      inputSchema: z.object({ location: z.string() }),
    };
  });
});

describe('FunctionTool', () => {
  it('should expose the function tool discriminator', () => {
    expectTypeOf<FunctionTool>()
      .toHaveProperty('type')
      .toEqualTypeOf<undefined | 'function'>();
  });

  describe('common properties', () => {
    it('should include function tools in the Tool union', () => {
      expectTypeOf<
        FunctionTool<{ number: number }, string, Context>
      >().toExtend<Tool<{ number: number }, string, Context>>();
    });
  });

  it('should allow omitted and explicit function discriminators', () => {
    const toolWithOmittedType: FunctionTool<{ location: string }, never> = {
      inputSchema: z.object({ location: z.string() }),
    };

    const toolWithFunctionType: FunctionTool<{ location: string }, never> = {
      type: 'function',
      inputSchema: z.object({ location: z.string() }),
    };

    expectTypeOf(toolWithOmittedType.type).toEqualTypeOf<
      undefined | 'function'
    >();
    expectTypeOf(toolWithFunctionType.type).toEqualTypeOf<
      undefined | 'function'
    >();
  });

  it('should reject dynamic and provider-only properties', () => {
    const _toolWithDynamicType: FunctionTool<{ location: string }, never> = {
      // @ts-expect-error函数工具不能使用动态鉴别器
      type: 'dynamic',
      inputSchema: z.object({ location: z.string() }),
    };

    const _toolWithProviderType: FunctionTool<{ location: string }, never> = {
      // @ts-expect-error 函数工具无法使用提供者鉴别器
      type: 'provider',
      inputSchema: z.object({ location: z.string() }),
    };

    const _toolWithProviderId: FunctionTool<{ location: string }, never> = {
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 函数工具不能有提供者 ID
      id: 'test.tool',
    };

    const _toolWithProviderArgs: FunctionTool<{ location: string }, never> = {
      inputSchema: z.object({ location: z.string() }),
      // @ts-expect-error 函数工具不能有提供者参数
      args: {},
    };

    const _toolWithDeferredResults: FunctionTool<{ location: string }, never> =
      {
        inputSchema: z.object({ location: z.string() }),
        // @ts-expect-error 函数工具无法支持延迟的提供程序结果
        supportsDeferredResults: true,
      };
  });

  it('should require an output schema when there is no execute function', () => {
    // 具有具体输出的@ts-expect-error工具需要outputSchema或execute
    const _tool: FunctionTool<{ location: string }, string, Context> = {
      inputSchema: z.object({ location: z.string() }),
    };
  });
});

describe('Tool', () => {
  describe('discriminated union', () => {
    it('should expose all tool variants and type discriminators', () => {
      expectTypeOf<Tool>().toEqualTypeOf<
        FunctionTool | DynamicTool | ProviderDefinedTool | ProviderExecutedTool
      >();

      type ToolType = Tool['type'];

      expectTypeOf<ToolType>().toEqualTypeOf<
        undefined | 'function' | 'dynamic' | 'provider'
      >();
    });

    it('should narrow tools by type', () => {
      const aTool = null as unknown as Tool<
        { number: number },
        string,
        Context
      >;

      if (aTool.type === 'provider') {
        expectTypeOf(aTool).toEqualTypeOf<
          | ProviderDefinedTool<{ number: number }, string, Context>
          | ProviderExecutedTool<{ number: number }, string, Context>
        >();

        if (aTool.isProviderExecuted) {
          expectTypeOf(aTool).toEqualTypeOf<
            ProviderExecutedTool<{ number: number }, string, Context>
          >();
        } else {
          expectTypeOf(aTool).toEqualTypeOf<
            ProviderDefinedTool<{ number: number }, string, Context>
          >();
        }
      } else if (aTool.type === 'dynamic') {
        expectTypeOf(aTool).toEqualTypeOf<
          DynamicTool<{ number: number }, string, Context>
        >();
      } else {
        expectTypeOf(aTool).toEqualTypeOf<
          FunctionTool<{ number: number }, string, Context>
        >();
      }
    });
  });
});

describe('tool helper', () => {
  describe('input type', () => {
    it('should infer input type from a Zod inputSchema', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
      });

      expectTypeOf(aTool).toEqualTypeOf<
        Tool<{ number: number }, never, Context>
      >();
      expectTypeOf(aTool.type).toEqualTypeOf<
        undefined | 'function' | 'dynamic' | 'provider'
      >();
      expectTypeOf(aTool.execute).toEqualTypeOf<undefined>();
      expectTypeOf(aTool.execute).not.toEqualTypeOf<Function>();
      expectTypeOf(aTool.inputSchema).toEqualTypeOf<
        FlexibleSchema<{ number: number }>
      >();
    });

    it('should preserve input type from a FlexibleSchema', <T>() => {
      const aTool = tool({
        inputSchema: null as unknown as FlexibleSchema<T>,
      });

      expectTypeOf(aTool).toEqualTypeOf<Tool<T, never, Context>>();
      expectTypeOf(aTool.execute).toEqualTypeOf<undefined>();
      expectTypeOf(aTool.execute).not.toEqualTypeOf<Function>();
      expectTypeOf(aTool.inputSchema).toEqualTypeOf<FlexibleSchema<T>>();
    });

    it('should infer input type when inputExamples are present with an optional/default Zod schema', () => {
      const inputSchema = z.object({
        location: z.string(),
        unit: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
      });

      tool({
        description: 'Get the weather for a location',
        inputSchema,
        inputExamples: [
          { input: { location: 'San Francisco', unit: 'celsius' } },
        ],
        execute: async input => {
          expectTypeOf(input).toEqualTypeOf<z.infer<typeof inputSchema>>();
          return { temperature: 20, unit: input.unit };
        },
      });
    });

    it('should infer input type when inputExamples are present with a refined Zod schema', () => {
      const inputSchema = z.object({
        code: z.string().refine(val => val.length === 3),
      });

      tool({
        description: 'Get code details',
        inputSchema,
        inputExamples: [{ input: { code: 'ABC' } }],
        execute: async input => {
          expectTypeOf(input).toEqualTypeOf<z.infer<typeof inputSchema>>();
          return { valid: true };
        },
      });
    });
  });

  describe('context type', () => {
    it('should infer context type from contextSchema in execute', () => {
      const contextSchema = z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      });

      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        contextSchema,
        execute: async (input, options) => {
          expectTypeOf(input).toEqualTypeOf<{ number: number }>();
          expectTypeOf(options.context).toEqualTypeOf<
            z.infer<typeof contextSchema>
          >();
          return 'test' as const;
        },
      });

      expectTypeOf(aTool).toEqualTypeOf<
        Tool<{ number: number }, 'test', z.infer<typeof contextSchema>>
      >();
    });

    it('should infer context type from contextSchema in input lifecycle callbacks', () => {
      const contextSchema = z.object({
        requestId: z.string(),
      });

      tool({
        inputSchema: z.object({ number: z.number() }),
        contextSchema,
        onInputStart: options => {
          expectTypeOf(options.context).toEqualTypeOf<
            z.infer<typeof contextSchema>
          >();
        },
        onInputDelta: options => {
          expectTypeOf(options.inputTextDelta).toEqualTypeOf<string>();
          expectTypeOf(options.context).toEqualTypeOf<
            z.infer<typeof contextSchema>
          >();
        },
        onInputAvailable: options => {
          expectTypeOf(options.input).toEqualTypeOf<{ number: number }>();
          expectTypeOf(options.context).toEqualTypeOf<
            z.infer<typeof contextSchema>
          >();
        },
      });
    });
  });

  describe('output type', () => {
    it('should infer output type from an execute function', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        execute: async input => {
          expectTypeOf(input).toEqualTypeOf<{ number: number }>();
          return 'test' as const;
        },
      });

      expectTypeOf(aTool).toEqualTypeOf<
        Tool<{ number: number }, 'test', Context>
      >();
      expectTypeOf(aTool.execute).toExtend<
        ToolExecuteFunction<{ number: number }, 'test', Context> | undefined
      >();
      expectTypeOf(aTool.execute).not.toEqualTypeOf<undefined>();
      expectTypeOf(aTool.inputSchema).toEqualTypeOf<
        FlexibleSchema<{ number: number }>
      >();
    });

    it('should infer output type from an async generator execute function', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        execute: async function* () {
          yield 'test' as const;
        },
      });

      expectTypeOf(aTool).toEqualTypeOf<
        Tool<{ number: number }, 'test', Context>
      >();
      expectTypeOf(aTool.execute).toEqualTypeOf<
        ToolExecuteFunction<{ number: number }, 'test', Context> | undefined
      >();
      expectTypeOf(aTool.inputSchema).toEqualTypeOf<
        FlexibleSchema<{ number: number }>
      >();
    });
  });

  describe('toModelOutput', () => {
    it('should infer toModelOutput options when there is only an input schema', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        toModelOutput: ({ output }) => {
          expectTypeOf(output).toEqualTypeOf<any>();
          return { type: 'text', value: 'test' };
        },
      });

      expectTypeOf(aTool.toModelOutput).toExtend<
        | ((options: {
            toolCallId: string;
            input: { number: number };
            output: any;
          }) => ToolResultOutput | PromiseLike<ToolResultOutput>)
        | undefined
      >();
    });

    it('should infer toModelOutput options when there is an execute function', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        execute: async () => 'test' as const,
        toModelOutput: ({ output }) => {
          expectTypeOf(output).toEqualTypeOf<'test'>();
          return { type: 'text', value: 'test' };
        },
      });

      expectTypeOf(aTool.toModelOutput).toExtend<
        | ((options: {
            toolCallId: string;
            input: { number: number };
            output: 'test';
          }) => ToolResultOutput | PromiseLike<ToolResultOutput>)
        | undefined
      >();
    });

    it('should infer toModelOutput options when there is an output schema', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        outputSchema: z.literal('test'),
        toModelOutput: ({ output }) => {
          expectTypeOf(output).toEqualTypeOf<'test'>();
          return { type: 'text', value: 'test' };
        },
      });

      expectTypeOf(aTool.toModelOutput).toExtend<
        | ((options: {
            toolCallId: string;
            input: { number: number };
            output: 'test';
          }) => ToolResultOutput | PromiseLike<ToolResultOutput>)
        | undefined
      >();
    });
  });

  describe('needsApproval (function)', () => {
    it('should infer needsApproval arguments when there is only an input schema', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        needsApproval: (input, options) => {
          expectTypeOf(input).toEqualTypeOf<{ number: number }>();
          expectTypeOf(options).toEqualTypeOf<{
            toolCallId: string;
            messages: ModelMessage[];
            context: Context;
          }>();
          return true;
        },
      });

      expectTypeOf(aTool.needsApproval).toExtend<
        | boolean
        | ((
            input: { number: number },
            options: {
              toolCallId: string;
              messages: ModelMessage[];
              context: Context;
            },
          ) => boolean | PromiseLike<boolean>)
        | undefined
      >();
    });

    it('should infer needsApproval arguments when there is an execute function', () => {
      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        execute: async () => 'test' as const,
        needsApproval: (input, options) => {
          expectTypeOf(input).toEqualTypeOf<{ number: number }>();
          expectTypeOf(options).toEqualTypeOf<{
            toolCallId: string;
            messages: ModelMessage[];
            context: Context;
          }>();
          return true;
        },
      });

      expectTypeOf(aTool.needsApproval).toExtend<
        | boolean
        | ((
            input: { number: number },
            options: {
              toolCallId: string;
              messages: ModelMessage[];
              context: Context;
            },
          ) => boolean | PromiseLike<boolean>)
        | undefined
      >();
    });

    it('should infer needsApproval context from contextSchema', () => {
      const contextSchema = z.object({
        sessionId: z.string(),
        userRole: z.enum(['user', 'admin']),
      });

      const aTool = tool({
        inputSchema: z.object({ number: z.number() }),
        contextSchema,
        needsApproval: (input, options) => {
          expectTypeOf(input).toEqualTypeOf<{ number: number }>();
          expectTypeOf(options).toEqualTypeOf<{
            toolCallId: string;
            messages: ModelMessage[];
            context: z.infer<typeof contextSchema>;
          }>();
          return true;
        },
      });

      expectTypeOf(aTool.needsApproval).toExtend<
        | boolean
        | ((
            input: { number: number },
            options: {
              toolCallId: string;
              messages: ModelMessage[];
              context: z.infer<typeof contextSchema>;
            },
          ) => boolean | PromiseLike<boolean>)
        | undefined
      >();
    });
  });
});
