import { mcpApiHandler } from '@/util/mcp/handler';
import type { NextRequest } from 'next/server';

// 此路由 (/chat/mcp/server) 提供 MCP 服务器；由 useChat 用于连接服务器并获取 tools 的 /mcp/chat 路由调用：
const requestHandler = (req: NextRequest) => {
  return mcpApiHandler(req);
};

export {
  requestHandler as DELETE,
  requestHandler as GET,
  requestHandler as POST,
};
