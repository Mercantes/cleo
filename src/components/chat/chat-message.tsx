'use client';

import { memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { parseVisuals } from '@/lib/ai/visual-types';
import { ChatVisual } from './chat-visual';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export const ChatMessage = memo(function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user';
  const { text, visuals } = isUser ? { text: content, visuals: [] } : parseVisuals(content);

  return (
    <div className={cn('group flex gap-2 px-4 py-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Image
          src="/favicon.svg"
          alt="Cleo"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full"
        />
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {text && <div className="whitespace-pre-wrap">{text}</div>}
        {visuals.map((visual, i) => (
          <ChatVisual key={`${visual.type}-${visual.title}-${i}`} visual={visual} />
        ))}
        {createdAt && (
          <time
            dateTime={createdAt}
            className="mt-1 block text-[10px] opacity-50"
          >
            {new Date(createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </time>
        )}
      </div>
    </div>
  );
});
