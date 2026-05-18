/**
 * 仅类型模块：声明受支持的 Gemini Interactions 代理的联合
 * 名称。由 `google.interactions({ agent })` 工厂分支使用。
 *
 * 源自 `googleapis/js-genai` `src/interactions/resources/interactions.ts`
 * （“Interaction.agent”枚举）。随着 Google 添加新代理，可能会进行扩展。
 *
 * 这是一个严格的字符串-文字联合（没有“字符串”转义舱口），因此
 * 传递未知的代理名称会导致编译时错误。在此添加新代理
 * 当谷歌发布它们时。
 */

export type GoogleInteractionsAgentName =
  | 'deep-research-pro-preview-12-2025'
  | 'deep-research-preview-04-2026'
  | 'deep-research-max-preview-04-2026';
