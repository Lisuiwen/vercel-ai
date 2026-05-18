/**
 * 对解析的 JSON 对象执行两个已完成比较。
 *
 * @param {any} obj1 - 要比较的第一个对象。
 * @param {any} obj2 - 要比较的第二个对象。
 * @returns {boolean} - 如果两个对象深度相等则返回 true，否则返回 false。
 */
export function isDeepEqualData(obj1: any, obj2: any): boolean {
  // 首先检查严格相等
  if (obj1 === obj2) return true;

  // 检查是否为空或未定义
  if (obj1 == null || obj2 == null) return false;

  // 检查两者是否都是对象
  if (typeof obj1 !== 'object' && typeof obj2 !== 'object')
    return obj1 === obj2;

  // 如果它们不严格相等，则它们都需要是对象
  if (obj1.constructor !== obj2.constructor) return false;

  // Date对象的特殊处理
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  // 处理数组：比较长度，然后对每个项目执行递归深度比较
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!isDeepEqualData(obj1[i], obj2[i])) return false;
    }
    return true; // 所有数组元素都匹配
  }

  // 比较每个对象中的键集
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;

  // 递归检查每个键值对
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isDeepEqualData(obj1[key], obj2[key])) return false;
  }

  return true; // 所有键和值都匹配
}
