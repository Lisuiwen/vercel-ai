export type LanguageModelV4ToolChoice =
  | { type: 'auto' } // 自动选择工具（可以没有工具）
  | { type: 'none' } // 无需选择任何工具
  | { type: 'required' } // 必须选择可用工具之一
  | { type: 'tool'; toolName: string }; // 必须选择一个特定的工具：
