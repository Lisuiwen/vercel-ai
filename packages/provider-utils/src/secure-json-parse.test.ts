// 根据 BSD-3-Clause 许可（仅限此文件）
// 代码改编自https://github.com/fastify/secure-json-parse/blob/783fcb1b5434709466759847cec974381939673a/test/index.test.js
//
// 版权所有 (c) Vercel, Inc. (https://vercel.com)
// 版权所有 (c) 2019 Fastify 团队
// 版权所有 (c) 2019，Sideway Inc 和项目贡献者
// 版权所有。
//
// 完整的贡献者列表可以在以下位置找到：
// - https://github.com/hapijs/bourne/graphs/contributors
// - https://github.com/fastify/secure-json-parse/graphs/contributors
// - https://github.com/vercel/ai/commits/main/packages/provider-utils/src/secure-parse-json.test.ts
//
// 如果满足以下条件，则允许以源代码和二进制形式重新分发和使用，无论是否经过修改：
//
// 1. 源代码的重新分发必须保留上述版权声明、本条件列表和以下免责声明。
//
// 2. 以二进制形式重新分发必须在随分发提供的文档和/或其他材料中复制上述版权声明、此条件列表以及以下免责声明。
//
// 3. 未经事先书面许可，不得使用版权所有者的名称或其贡献者的名称来认可或推广源自本软件的产品。
//
// 本软件由版权所有者和贡献者“按原样”提供，不承担任何明示或默示的保证，包括但不限于适销性和特定用途适用性的默示保证。在任何情况下，版权所有者或贡献者均不对任何直接、间接、附带、特殊、惩戒性或后果性损害（包括但不限于采购替代商品或服务；使用、数据或利润损失；或业务损失）承担责任。中断），无论是何种原因造成的，并且基于任何责任理论，无论是合同责任、严格责任还是侵权行为（包括疏忽或其他），均因使用本软件而产生，即使已被告知可能发生此类损害。

import { describe, it, expect } from 'vitest';
import { secureJsonParse } from './secure-json-parse';

describe('secureJsonParse', () => {
  it('parses object string', () => {
    expect(secureJsonParse('{"a": 5, "b": 6}')).toStrictEqual(
      JSON.parse('{"a": 5, "b": 6}'),
    );
  });

  it('parses null string', () => {
    expect(secureJsonParse('null')).toStrictEqual(JSON.parse('null'));
  });

  it('parses 0 string', () => {
    expect(secureJsonParse('0')).toStrictEqual(JSON.parse('0'));
  });

  it('parses string string', () => {
    expect(secureJsonParse('"X"')).toStrictEqual(JSON.parse('"X"'));
  });

  it('allows constructor property with non-object value', () => {
    expect(secureJsonParse('{ "constructor": "string value" }')).toStrictEqual({
      constructor: 'string value',
    });
  });

  it('allows constructor property with null value', () => {
    expect(secureJsonParse('{ "constructor": null }')).toStrictEqual({
      constructor: null,
    });
  });

  it('errors on constructor property', () => {
    const text =
      '{ "a": 5, "b": 6, "constructor": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }';

    expect(() => secureJsonParse(text)).toThrow(SyntaxError);
  });

  it('errors on proto property', () => {
    const text =
      '{ "a": 5, "b": 6, "__proto__": { "x": 7 }, "c": { "d": 0, "e": "text", "__proto__": { "y": 8 }, "f": { "g": 2 } } }';

    expect(() => secureJsonParse(text)).toThrow(SyntaxError);
  });

  it('errors on unicode-escaped __proto__ property', () => {
    const text = '{ "\\u005f\\u005fproto__": { "isAdmin": true } }';
    expect(() => secureJsonParse(text)).toThrow(SyntaxError);
  });

  it('errors on fully unicode-escaped __proto__ property', () => {
    const text =
      '{ "\\u005f\\u005f\\u0070\\u0072\\u006f\\u0074\\u006f\\u005f\\u005f": { "isAdmin": true } }';
    expect(() => secureJsonParse(text)).toThrow(SyntaxError);
  });

  it('errors on unicode-escaped constructor property', () => {
    const text =
      '{ "\\u0063\\u006fnstructor": { "prototype": { "isAdmin": true } } }';
    expect(() => secureJsonParse(text)).toThrow(SyntaxError);
  });

  it('errors on fully unicode-escaped constructor property', () => {
    const text =
      '{ "\\u0063\\u006f\\u006e\\u0073\\u0074\\u0072\\u0075\\u0063\\u0074\\u006f\\u0072": { "prototype": { "isAdmin": true } } }';
    expect(() => secureJsonParse(text)).toThrow(SyntaxError);
  });
});
