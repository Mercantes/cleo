'use client';

import { cn } from '@/lib/utils';
import { parseVisuals } from '@/lib/ai/visual-types';
import { ChatVisual } from './chat-visual';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user';
  const { text, visuals } = isUser ? { text: content, visuals: [] } : parseVisuals(content);

  return (
    <div className={cn('group flex gap-2 px-4 py-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
          🤖
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {text && <div className="whitespace-pre-wrap">{text}</div>}
        {visuals.map((visual, i) => (
          <ChatVisual key={i} visual={visual} />
        ))}
        {createdAt && (
          <p className="mt-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-60">
            {new Date(createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
