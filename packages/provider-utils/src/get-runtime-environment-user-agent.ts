export function getRuntimeEnvironmentUserAgent(
  globalThisAny: any = globalThis as any,
): string {
  // 浏览器
  if (globalThisAny.window) {
    return `runtime/browser`;
  }

  // Cloudflare Workers / Deno / Bun / Node.js >= 21.1
  if (globalThisAny.navigator?.userAgent) {
    return `runtime/${globalThisAny.navigator.userAgent.toLowerCase()}`;
  }

  // 节点.js < 21.1
  if (globalThisAny.process?.versions?.node) {
    return `runtime/node.js/${globalThisAny.process.version.substring(0)}`;
  }

  if (globalThisAny.EdgeRuntime) {
    return `runtime/vercel-edge`;
  }

  return 'runtime/unknown';
}
