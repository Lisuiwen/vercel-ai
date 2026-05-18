// 填充 Performance.now() 以支持没有它的环境：
export function now(): number {
  return globalThis?.performance?.now() ?? Date.now();
}
