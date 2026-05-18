import type { UIMessage } from '../ui/ui-messages';

/**
 * 流式处理期间步骤完成时调用的回调。
 * 这对于在多步骤代理运行期间保留中间 UI 消息非常有用。
 */
export type UIMessageStreamOnStepFinishCallback<UI_MESSAGE extends UIMessage> =
  (event: {
    /**
     * 此步骤结束时更新的UI消息列表。
     */
    messages: UI_MESSAGE[];

    /**
     * 指示响应消息是否是上一条原始消息的延续，
     * 或者是否创建了新消息。
     */
    isContinuation: boolean;

    /**
     * 作为响应发送给客户端的消息
     * （如果有扩展，则包括原始消息）。
     */
    responseMessage: UI_MESSAGE;
  }) => PromiseLike<void> | void;
