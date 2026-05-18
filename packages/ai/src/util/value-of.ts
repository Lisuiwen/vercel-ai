// 仅此文件的许可证：
//
// 麻省理工学院许可证
//
// 版权所有 (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
// 版权所有 (c) Vercel, Inc. (https://vercel.com)
//
// 特此免费向获得本软件及其相关副本的任何人授予许可
// 文档文件（“软件”），不受限制地处理软件，包括但不限于
// 使用、复制、修改、合并、发布、分发、再许可和/或出售软件副本的权利，以及
// 允许向其提供软件的人员这样做，但须满足以下条件：
//
// 上述版权声明和本许可声明应包含在所有副本或主要部分中
// 该软件的。
//
// 该软件按“原样”提供，不提供任何类型的明示或默示保证，包括但不限于
// 对适销性、特定用途的适用性和不侵权的保证。在任何情况下都不得
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
// 因本软件或使用或其他交易而产生、产生或与之相关的合同、侵权行为或其他行为
// 在软件中。

/**
 * 创建给定对象值的并集，并可以选择指定从哪些键获取值。
 *
 * 如果您希望将此类型作为 TypeScript 的内置类型，请投票[此问题](https://github.com/microsoft/TypeScript/issues/31438)。
 *
 * @example
 * ```
 * // 数据.json
 * {
 * 	“富”：1，
 * 	“酒吧”：2，
 * 	“商业”：3
 * }
 *
 * // main.ts
 * 从 'type-fest' 导入类型 {ValueOf}；
 * 导入数据 = require('./data.json');
 *
 * 导出函数 getData(name: string): ValueOf<datatype> {
 * 	返回数据[名称]；
 * }
 *
 * 导出函数 onlyBar(name: string): ValueOf<typeof data, 'bar'> {
 * 	返回数据[名称]；
 * }
 *
 * // 文件.ts
 * 从 './main' 导入 {getData, onlyBar};
 *
 * getData('foo');
 * //=> 1
 *
 * onlyBar('foo');
 * //=> 类型错误 ...
 *
 * onlyBar('酒吧');
 * //=> 2
 * ```
 * @see https://github.com/sindresorhus/type-fest/blob/main/source/value-of.d.ts
 */
export type ValueOf<
  ObjectType,
  ValueType extends keyof ObjectType = keyof ObjectType,
> = ObjectType[ValueType];
