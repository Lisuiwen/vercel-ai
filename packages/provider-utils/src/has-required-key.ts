/**
 * 检查对象是否具有所需的键。
 * @param OBJECT - The object to check.
 * @returns True if the object has required keys, false otherwise.
 */
export type HasRequiredKey<OBJECT> = {} extends OBJECT ? false : true;
