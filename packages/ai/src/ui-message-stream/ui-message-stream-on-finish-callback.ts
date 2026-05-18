import type { FinishReason } from '../types/language-model';
import type { UIMessage } from '../ui/ui-messages';

export type UIMessageStreamOnFinishCallback<UI_MESSAGE extends UIMessage> =
  (event: {
    /**
     * 更新的 UI 消息列表。
     */
    messages: UI_MESSAGE[];

    /**
     * 指示响应消息是否是上一条原始消息的延续，
     * 或者是否创建了新消息。
     */
    isContinuation: boolean;

    /**
     * 指示流是否被中止。
     */
    isAborted: boolean;

    /**
     * 作为响应发送给客户端的消息
     * （如果有扩展，则包括原始消息）。
     */
    responseMessage: UI_MESSAGE;

    /**
     * 一代完结的原因。
     */
    finishReason?: FinishReason;
  }) => PromiseLike<void> | void;
