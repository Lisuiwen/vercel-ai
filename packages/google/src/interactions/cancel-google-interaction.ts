import {
  combineHeaders,
  getRuntimeEnvironmentUserAgent,
  withUserAgentSuffix,
  type FetchFunction,
} from '@ai-sdk/provider-utils';

const getOriginalFetch = () => globalThis.fetch;

/**
 * 尽力“POST /interactions/{id}/cancel”来停止后台交互
 * 在调用者本地中止后，在 Google 这边。错误和非 2xx
 * 响应被吞没，因此取消失败无法掩盖原始中止。
 *
 * 如果“interactionId”丢失/为空，则完全跳过请求 - 例如当
 * 交互是使用“store: false”创建的，并且 API 没有返回
 * ID。
 */
export async function cancelGoogleInteraction({
  baseURL,
  interactionId,
  headers,
  fetch = getOriginalFetch(),
}: {
  baseURL: string;
  interactionId: string | null | undefined;
  headers: Record<string, string | undefined>;
  fetch?: FetchFunction;
}): Promise<void> {
  if (interactionId == null || interactionId.length === 0) {
    return;
  }

  const url = `${baseURL}/interactions/${encodeURIComponent(interactionId)}/cancel`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: withUserAgentSuffix(
        combineHeaders({ 'Content-Type': 'application/json' }, headers),
        getRuntimeEnvironmentUserAgent(),
      ),
      body: '{}',
    });

    /*
     * 清空主体，以便 undici/Node 可以将连接返回到池中。
     * 故意忽略错误（例如非 2xx、网络故障）：this
     * 是尽力而为的清理，并且不能扔过调用者，这是
     * 已经处理中止/失败的运行。
     */
    try {
      await response.text();
    } catch {
      // 忽略
    }
  } catch {
    // 忽略——取消是尽力而为
  }
}
