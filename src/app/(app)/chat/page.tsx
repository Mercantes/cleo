import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';

export const metadata: Metadata = {
  title: 'Pergunte à Cleo',
};

export default function ChatPage() {
  return (
    <div className="-m-3 -mb-32 flex h-[calc(100dvh-3.5rem)] flex-col sm:-m-4 sm:-mb-32 md:-m-6 md:-mb-6">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        }
      >
        <ChatInterface />
      </Suspense>
      {/* Spacer for fixed bottom nav + safe area on mobile */}
      <div className="shrink-0 pt-[4.5rem] pb-safe md:hidden" aria-hidden="true" />
    </div>
  );
}
