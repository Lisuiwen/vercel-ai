// btoa 和 atob 需要作为函数调用来调用，而不是作为方法调用。
// 否则 CloudFlare 将抛出
// “类型错误：非法调用：使用不正确的此引用调用的函数”
const { btoa, atob } = globalThis;

export function convertBase64ToUint8Array(base64String: string) {
  const base64Url = base64String.replace(/-/g, '+').replace(/_/g, '/');
  const latin1string = atob(base64Url);
  return Uint8Array.from(latin1string, byte => byte.codePointAt(0)!);
}

export function convertUint8ArrayToBase64(array: Uint8Array): string {
  let latin1string = '';

  // 注意：常规 for 循环支持较旧的 JavaScript 版本
  // 不支持 Uint8Array 上的 ..of
  for (let i = 0; i < array.length; i++) {
    latin1string += String.fromCodePoint(array[i]);
  }

  return btoa(latin1string);
}

export function convertToBase64(value: string | Uint8Array): string {
  return value instanceof Uint8Array ? convertUint8ArrayToBase64(value) : value;
}
