import { tool, type InferToolContext, type Tool } from '@ai-sdk/provider-utils';
import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import type { ToolsContextParameter } from './tools-context-parameter';

describe('ToolsContextParameter', () => {
  it('uses toolsContext?: never for an empty toolset', () => {
    type Tools = {};
    type Expected = {
      tools?: Tools;
      toolsContext?: never;
    };

    expectTypeOf<ToolsContextParameter<Tools>>().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<ToolsContextParameter<Tools>>();
  });

  it('uses toolsContext?: never when no tool requires context', () => {
    type Tools = {
      weather: Tool<{ city: string }>;
    };
    type Expected = {
      tools?: Tools;
      toolsContext?: never;
    };

    expectTypeOf<ToolsContextParameter<Tools>>().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<ToolsContextParameter<Tools>>();
  });

  it('makes toolsContext required when a tool has required context', () => {
    type Tools = {
      weather: Tool<{ city: string }, any, { userId: string }>;
    };
    type Expected = {
      tools?: Tools;
      toolsContext: {
        weather: {
          userId: string;
        };
      };
    };

    expectTypeOf<ToolsContextParameter<Tools>>().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<ToolsContextParameter<Tools>>();
  });

  it('makes toolsContext required when a tool has optional-only context properties', () => {
    type Tools = {
      weather: Tool<{ city: string }, any, { userId?: string }>;
    };
    type Expected = {
      tools?: Tools;
      toolsContext: {
        weather: {
          userId?: string;
        };
      };
    };

    expectTypeOf<ToolsContextParameter<Tools>>().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<ToolsContextParameter<Tools>>();
  });

  it('makes toolsContext optional when the context object is optional', () => {
    type Tools = {
      weather: Tool<{ city: string }, any, { userId: string } | undefined>;
    };
    type Expected = {
      tools?: Tools;
      toolsContext?: {
        weather?: { userId: string } | undefined;
      };
    };

    expectTypeOf<ToolsContextParameter<Tools>>().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<ToolsContextParameter<Tools>>();
  });

  it('includes only contextual tools in the inferred toolsContext map', () => {
    type Tools = {
      weather: Tool<{ location: string }>;
      calculator: Tool<
        { expression: string },
        any,
        { calculatorApiKey: string }
      >;
    };
    type Expected = {
      tools?: Tools;
      toolsContext: {
        calculator: {
          calculatorApiKey: string;
        };
      };
    };

    expectTypeOf<ToolsContextParameter<Tools>>().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<ToolsContextParameter<Tools>>();
  });

  it('infers a per-tool toolsContext map from tool definitions', () => {
    const tools = {
      weather: tool({
        inputSchema: z.object({
          location: z.string(),
        }),
        contextSchema: z.object({
          weatherApiKey: z.string(),
        }),
        execute: async ({ location }, { context: { weatherApiKey } }) => {
          return { location, weatherApiKey };
        },
      }),
      calculator: tool({
        inputSchema: z.object({
          expression: z.string(),
        }),
        contextSchema: z.object({
          calculatorApiKey: z.string(),
        }),
        execute: async ({ expression }, { context: { calculatorApiKey } }) => {
          return { expression, calculatorApiKey };
        },
      }),
    };

    type Expected = {
      tools?: typeof tools;
      toolsContext: {
        weather: {
          weatherApiKey: string;
        };
        calculator: {
          calculatorApiKey: string;
        };
      };
    };

    expectTypeOf<
      ToolsContextParameter<typeof tools>
    >().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<
      ToolsContextParameter<typeof tools>
    >();
  });

  it('keeps each tool context specific in mixed toolsets', () => {
    const tools = {
      weather: tool({
        inputSchema: z.object({
          location: z.string(),
        }),
        contextSchema: z.object({
          weatherApiKey: z.string(),
        }),
        execute: async ({ location }, { context: { weatherApiKey } }) => {
          return { location, weatherApiKey };
        },
      }),
      calculator: tool({
        inputSchema: z.object({
          expression: z.string(),
        }),
      }),
    };

    type WeatherContext = InferToolContext<(typeof tools)['weather']>;

    expectTypeOf<WeatherContext>().toMatchObjectType<{
      weatherApiKey: string;
    }>();
    expectTypeOf<ToolsContextParameter<typeof tools>>().toMatchTypeOf<{
      tools?: typeof tools;
      toolsContext: {
        weather: {
          weatherApiKey: string;
        };
      };
    }>();
  });

  it('uses toolsContext?: never when a tool has an empty context object', () => {
    type Tools = {
      weather: Tool<{ city: string }, any, {}>;
    };
    type Expected = {
      tools?: Tools;
      toolsContext?: never;
    };

    expectTypeOf<ToolsContextParameter<Tools>>().toMatchTypeOf<Expected>();
    expectTypeOf<Expected>().toMatchTypeOf<ToolsContextParameter<Tools>>();
  });

  describe('negative cases', () => {
    it('errors when toolsContext is provided for an empty toolset', () => {
      type Tools = {};

      const unnecessaryToolsContext: ToolsContextParameter<Tools> = {
        // @ts-expect-error - 当没有工具需要时，不接受toolsContext
        toolsContext: {},
      };

      expectTypeOf(unnecessaryToolsContext).toEqualTypeOf<
        ToolsContextParameter<Tools>
      >();
    });

    it('errors when toolsContext is omitted for a toolset with contextual tools', () => {
      type Tools = {
        weather: Tool<{ location: string }>;
        calculator: Tool<
          { expression: string },
          any,
          { calculatorApiKey: string }
        >;
      };

      // @ts-expect-error - 当集合中的一个工具需要它时，需要toolsContext
      const missingToolsContext: ToolsContextParameter<Tools> = {};

      expectTypeOf(missingToolsContext).toEqualTypeOf<
        ToolsContextParameter<Tools>
      >();
    });

    it('errors when required nested tool context fields are missing', () => {
      type Tools = {
        weather: Tool<{ city: string }, any, { userId: string }>;
      };

      const missingRequiredField: ToolsContextParameter<Tools> = {
        toolsContext: {
          // @ts-expect-error - 必须提供必需的嵌套工具上下文字段
          weather: {},
        },
      };

      expectTypeOf(missingRequiredField).toEqualTypeOf<
        ToolsContextParameter<Tools>
      >();
    });

    it('errors when optional-only nested tool context fields have the wrong type', () => {
      type Tools = {
        weather: Tool<{ city: string }, any, { userId?: string }>;
      };

      const invalidOptionalField: ToolsContextParameter<Tools> = {
        toolsContext: {
          weather: {
            // @ts-expect-error - 可选的嵌套工具上下文字段必须与其声明的类型匹配
            userId: 123,
          },
        },
      };

      expectTypeOf(invalidOptionalField).toEqualTypeOf<
        ToolsContextParameter<Tools>
      >();
    });

    it('errors when optional context object fields are missing after the entry is provided', () => {
      type Tools = {
        weather: Tool<{ city: string }, any, { userId: string } | undefined>;
      };

      const missingOptionalObjectField: ToolsContextParameter<Tools> = {
        toolsContext: {
          // @ts-expect-error - 提供的可选上下文对象必须满足其对象类型
          weather: {},
        },
      };

      expectTypeOf(missingOptionalObjectField).toEqualTypeOf<
        ToolsContextParameter<Tools>
      >();
    });

    it('errors when the contextual tool key is missing from toolsContext', () => {
      const tools = {
        weather: tool({
          inputSchema: z.object({
            location: z.string(),
          }),
          contextSchema: z.object({
            weatherApiKey: z.string(),
          }),
          execute: async ({ location }, { context: { weatherApiKey } }) => {
            return { location, weatherApiKey };
          },
        }),
        calculator: tool({
          inputSchema: z.object({
            expression: z.string(),
          }),
        }),
      };

      const missingToolEntry: ToolsContextParameter<typeof tools> = {
        tools,
        // @ts-expect-error - toolsContext 必须包含上下文工具键
        toolsContext: {},
      };

      expectTypeOf(missingToolEntry).toEqualTypeOf<
        ToolsContextParameter<typeof tools>
      >();
    });
  });
});
