'use client';

import { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseVisuals } from '@/lib/ai/visual-types';
import { ChatVisual } from './chat-visual';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copiado' : 'Copiar mensagem'}
      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        const code = codeLines.join('\n');
        elements.push(
          <CodeBlock key={`code-${codeKey++}`} code={code} />,
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    elements.push(<span key={i}>{formatInline(line)}{i < lines.length - 1 ? '\n' : ''}</span>);
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <CodeBlock key={`code-${codeKey}`} code={codeLines.join('\n')} />,
    );
  }

  return elements;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="my-1 overflow-hidden rounded-md bg-background/50">
      <div className="flex items-center justify-between px-3 py-1 text-[10px] text-muted-foreground">
        <span>código</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-foreground">
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 pb-2 text-xs leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-background/50 px-1 py-0.5 text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const ChatMessage = memo(function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === 'user';
  const { text, visuals } = isUser ? { text: content, visuals: [] } : parseVisuals(content);

  return (
    <div className={cn('group flex gap-2 px-4 py-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Image
          src="/favicon.png"
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
        {text && (
          <div className="whitespace-pre-wrap">
            {isUser ? text : renderMarkdown(text)}
          </div>
        )}
        {visuals.map((visual, i) => (
          <ChatVisual key={`${visual.type}-${visual.title}-${i}`} visual={visual} />
        ))}
        <div className="mt-1 flex items-center justify-between gap-2">
          {createdAt && (
            <time
              dateTime={createdAt}
              className="text-[10px] opacity-0 transition-opacity group-hover:opacity-50"
            >
              {new Date(createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </time>
          )}
          {!isUser && text && <CopyButton text={text} />}
        </div>
      </div>
    </div>
  );
});
