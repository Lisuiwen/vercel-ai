import { loadChat } from '@util/chat-store';
import Chat from './chat';
import type { UIMessage } from 'ai';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  // 从 URL 获取 chat ID：
  const { id } = await props.params;

  // 加载聊天消息：
  const messages = (await loadChat(id)) as UIMessage<{ createdAt: string }>[];

  // 展示聊天：
  return <Chat id={id} initialMessages={messages} />;
}
