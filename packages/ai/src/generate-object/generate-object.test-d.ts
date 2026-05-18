import { describe, expectTypeOf, it } from 'vitest';
import { generateObject } from './generate-object';
import { z } from 'zod/v4';
import type { JSONValue } from '@ai-sdk/provider';

describe('generateObject', () => {
  it('should not accept timeout option', async () => {
    generateObject({
      schema: z.object({ number: z.number() }),
      model: undefined!,
      messages: [],
      // 已废弃的generateObject API不支持@ts-expect-error超时
      timeout: 5000,
    });
  });

  it('should support enum types', async () => {
    const result = await generateObject({
      output: 'enum',
      enum: ['a', 'b', 'c'] as const,
      model: undefined!,
      messages: [],
    });

    expectTypeOf<typeof result.object>().toEqualTypeOf<'a' | 'b' | 'c'>;
  });

  it('should support schema types', async () => {
    const result = await generateObject({
      schema: z.object({ number: z.number() }),
      model: undefined!,
      messages: [],
    });

    expectTypeOf<typeof result.object>().toEqualTypeOf<{ number: number }>();
  });

  it('should support no-schema output mode', async () => {
    const result = await generateObject({
      output: 'no-schema',
      model: undefined!,
      messages: [],
    });

    expectTypeOf<typeof result.object>().toEqualTypeOf<JSONValue>();
  });

  it('should support array output mode', async () => {
    const result = await generateObject({
      output: 'array',
      schema: z.number(),
      model: undefined!,
      messages: [],
    });

    expectTypeOf<typeof result.object>().toEqualTypeOf<number[]>();
  });
});
