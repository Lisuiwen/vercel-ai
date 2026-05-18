import { UIDataTypes, type UIMessage } from 'ai';
export type ElicitationAction = 'accept' | 'decline' | 'cancel';

export interface ElicitationRequest {
  id: string;
  message: string;
  requestedSchema: unknown;
}

export interface ElicitationResponse {
  id: string;
  action: ElicitationAction;
  content?: Record<string, unknown>;
}

// 为征询定义自定义数据类型
export type ElicitationDataTypes = {
  'elicitation-request': {
    elicitationId: string;
    message: string;
    requestedSchema: unknown;
  };
  'elicitation-response': {
    elicitationId: string;
    action: ElicitationAction;
    content?: Record<string, unknown>;
  };
};

// 使用征询 data parts 定义自定义消息类型
export type MCPElicitationUIMessage = UIMessage<
  never, // metadata 类型
  ElicitationDataTypes,
  never // 本示例无 tools（所有 tools 来自 MCP）
>;
