'use client';

import { memo, useState, useCallback } from 'react';
import Image from 'next/image';
import { Copy, Check, Loader2, CheckCircle2, XCircle, FileText, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseVisuals } from '@/lib/ai/visual-types';
import { ChatVisual } from './chat-visual';

interface ToolAction {
  tool: string;
  status: 'executing' | 'success' | 'error';
  description?: string;
}

interface AttachmentMeta {
  name: string;
  type: string;
  size: number;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  toolActions?: ToolAction[];
  metadata?: { attachments?: AttachmentMeta[] };
}

const TOOL_LABELS: Record<string, string> = {
  create_goal: 'Definindo meta',
  categorize_transaction: 'Recategorizando transação',
  create_challenge: 'Criando desafio',
  create_budget: 'Definindo orçamento',
  manage_recurring: 'Gerenciando recorrência',
};

function ToolActionBadge({ action }: { action: ToolAction }) {
  const label = TOOL_LABELS[action.tool] || action.tool;

  if (action.status === 'executing') {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-600 dark:text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}...
      </div>
    );
  }

  if (action.status === 'success') {
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        {action.description || label}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-500 dark:text-red-400">
      <XCircle className="h-3 w-3" />
      {action.description || 'Erro na ação'}
    </div>
  );
}

function AttachmentBadges({ attachments }: { attachments: AttachmentMeta[] }) {
  return (
    <div className="mb-1.5 flex flex-wrap gap-1">
      {attachments.map((att, i) => (
        <span
          key={`${att.name}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[11px]"
        >
          {att.type.startsWith('image/') ? (
            <ImageIcon className="h-3 w-3" />
          ) : (
            <FileText className="h-3 w-3" />
          )}
          {att.name}
        </span>
      ))}
    </div>
  );
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
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="my-1.5 space-y-0.5 pl-1">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      flushList();
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

    // List items: - text or * text or numbered 1. text
    const listMatch = line.match(/^[-*•]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/);
    if (listMatch) {
      listItems.push(
        <li key={`li-${i}`} className="flex gap-1.5 text-sm">
          <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
          <span>{formatInline(listMatch[1])}</span>
        </li>,
      );
      continue;
    }

    flushList();

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<p key={i} className="mt-2 mb-0.5 text-sm font-semibold">{formatInline(line.slice(4))}</p>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<p key={i} className="mt-2 mb-0.5 text-sm font-semibold">{formatInline(line.slice(3))}</p>);
      continue;
    }

    // Bold-only line (acts like a sub-header): **Title:**
    if (/^\*\*[^*]+\*\*:?\s*$/.test(line.trim())) {
      elements.push(<p key={i} className="mt-2 mb-0.5 text-sm font-semibold">{formatInline(line)}</p>);
      continue;
    }

    // Regular text
    elements.push(<p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>);
  }

  flushList();

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

export const ChatMessage = memo(function ChatMessage({ role, content, createdAt, toolActions, metadata }: ChatMessageProps) {
  const isUser = role === 'user';
  const { text, visuals } = isUser ? { text: content, visuals: [] } : parseVisuals(content);
  const attachments = metadata?.attachments;

  return (
    <div className={cn('group flex gap-2 px-4 py-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Image
          src="/logo.png"
          alt="Cleo"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full"
        />
      )}
      <div
        className={cn(
          'rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'max-w-[90%] bg-primary text-primary-foreground sm:max-w-[80%]'
            : 'max-w-[90%] bg-muted sm:max-w-[85%] lg:max-w-2xl',
        )}
      >
        {attachments && attachments.length > 0 && (
          <AttachmentBadges attachments={attachments} />
        )}
        {toolActions && toolActions.length > 0 && (
          <div className="mb-2 space-y-1">
            {toolActions.map((action, i) => (
              <ToolActionBadge key={`${action.tool}-${i}`} action={action} />
            ))}
          </div>
        )}
        {text && (
          <div className={isUser ? 'whitespace-pre-wrap' : ''}>
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
          <div className="flex items-center gap-1">
            {!isUser && text && text.length > 200 && (
              <span className="text-[9px] opacity-0 transition-opacity group-hover:opacity-40">
                {Math.ceil(text.length / 5)} palavras
              </span>
            )}
            {!isUser && text && <CopyButton text={text} />}
          </div>
        </div>
      </div>
    </div>
  );
});
