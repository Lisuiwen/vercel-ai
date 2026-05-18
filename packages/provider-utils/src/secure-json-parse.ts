// 根据 BSD-3-Clause 许可（仅限此文件）
// 代码改编自https://github.com/fastify/secure-json-parse/blob/783fcb1b5434709466759847cec974381939673a/index.js
//
// 版权所有 (c) Vercel, Inc. (https://vercel.com)
// 版权所有 (c) 2019 Fastify 团队
// 版权所有 (c) 2019，Sideway Inc 和项目贡献者
// 版权所有。
//
// 完整的贡献者列表可以在以下位置找到：
// - https://github.com/hapijs/bourne/graphs/contributors
// - https://github.com/fastify/secure-json-parse/graphs/contributors
// - https://github.com/vercel/ai/commits/main/packages/provider-utils/src/secure-parse-json.ts
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

const suspectProtoRx =
  /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
const suspectConstructorRx =
  /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;

function _parse(text: string) {
  // 正常解析
  const obj = JSON.parse(text);

  // 忽略 null 和非对象
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (
    suspectProtoRx.test(text) === false &&
    suspectConstructorRx.test(text) === false
  ) {
    return obj;
  }

  // 原始密钥的扫描结果
  return filter(obj);
}

function filter(obj: any) {
  let next = [obj];

  while (next.length) {
    const nodes = next;
    next = [];

    for (const node of nodes) {
      if (Object.prototype.hasOwnProperty.call(node, '__proto__')) {
        throw new SyntaxError('Object contains forbidden prototype property');
      }

      if (
        Object.prototype.hasOwnProperty.call(node, 'constructor') &&
        node.constructor !== null &&
        typeof node.constructor === 'object' &&
        Object.prototype.hasOwnProperty.call(node.constructor, 'prototype')
      ) {
        throw new SyntaxError('Object contains forbidden prototype property');
      }

      for (const key in node) {
        const value = node[key];
        if (value && typeof value === 'object') {
          next.push(value);
        }
      }
    }
  }
  return obj;
}

export function secureJsonParse(text: string) {
  const { stackTraceLimit } = Error;
  try {
    // 性能优化，参见https://github.com/fastify/secure-json-parse/pull/90
    Error.stackTraceLimit = 0;
  } catch {
    // 错误不可变时的回退（v8 只读）
    return _parse(text);
  }

  try {
    return _parse(text);
  } finally {
    Error.stackTraceLimit = stackTraceLimit;
  }
}
