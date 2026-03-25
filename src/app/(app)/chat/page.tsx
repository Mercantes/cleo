import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';

export const metadata: Metadata = {
  title: 'Pergunte à Cleo',
};

export default function ChatPage() {
  return (
    <div className="-mx-3 -mt-3 -mb-[calc(5rem+env(safe-area-inset-bottom,0px))] flex h-[calc(100dvh-3.5rem)] flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:-mx-4 sm:-mt-4 md:-mx-6 md:-mt-6 md:-mb-6 md:pb-0">
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
