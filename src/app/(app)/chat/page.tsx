import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';

export const metadata: Metadata = {
  title: 'Chat',
};

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col pb-16 md:pb-0">
      <Suspense fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }>
        <ChatInterface />
      </Suspense>
    </div>
  );
}
