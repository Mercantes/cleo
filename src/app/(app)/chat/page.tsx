import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';

export const metadata: Metadata = {
  title: 'Pergunte à Cleo',
};

export default function ChatPage() {
  return (
    <div className="-m-4 flex h-[calc(100dvh-3.5rem-4.5rem)] flex-col md:-m-6 md:h-[calc(100dvh-3.5rem)]">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        }
      >
        <ChatInterface />
      </Suspense>
    </div>
  );
}
