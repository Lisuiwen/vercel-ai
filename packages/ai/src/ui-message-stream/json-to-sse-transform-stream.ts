/**
 * 将 JSON 对象转换为服务器发送事件 (SSE) 格式的 TransformStream。
 * 每个对象都被序列化为 JSON 并以“data: ...\n\n”格式包装。
 * 当流结束时，会发送一条“data: [DONE]\n\n”消息。
 */
export class JsonToSseTransformStream extends TransformStream<unknown, string> {
  constructor() {
    super({
      transform(part, controller) {
        controller.enqueue(`data: ${JSON.stringify(part)}\n\n`);
      },
      flush(controller) {
        controller.enqueue('data: [DONE]\n\n');
      },
    });
  }
}
