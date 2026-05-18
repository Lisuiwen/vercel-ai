import { loadChat } from '@util/chat-store';
import Chat from './chat';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // 从 URL 获取 chat ID
  const messages = await loadChat(id); // 加载聊天消息
  return <Chat id={id} initialMessages={messages} />; // 展示聊天
}
