import { ChatInterface } from '@/components/chat/chat-interface';

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col pb-16 md:pb-0">
      <ChatInterface />
    </div>
  );
}
