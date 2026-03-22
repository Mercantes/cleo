'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { RotateCcw, Trash2 } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput, Attachment } from './chat-input';
import { ChatSuggestions } from './chat-suggestions';
import { TypingIndicator } from './typing-indicator';
import { toast } from '@/components/ui/toast';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  toolActions?: ToolAction[];
  metadata?: { attachments?: AttachmentMeta[] };
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [autoSent, setAutoSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const shouldAutoScroll = useRef(true);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current || isNearBottom()) {
      scrollToBottom();
      shouldAutoScroll.current = false;
    }
  }, [messages, isLoading, scrollToBottom, isNearBottom]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/chat/history');
        const data = await res.json();
        setMessages(data.messages || []);
        shouldAutoScroll.current = true;
      } catch {
        // Start with empty chat
      } finally {
        setIsHistoryLoaded(true);
      }
    }
    loadHistory();
  }, []);

  // Auto-send message from query param (e.g. from insights bar)
  useEffect(() => {
    if (!isHistoryLoaded || autoSent) return;
    const q = searchParams.get('q');
    if (q) {
      setAutoSent(true);
      sendMessage(q);
    }
  }, [isHistoryLoaded, searchParams, autoSent]); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    const currentAttachments = attachments;
    if ((!messageText && currentAttachments.length === 0) || isLoading) return;

    const attachmentMeta: AttachmentMeta[] = currentAttachments.map(a => ({
      name: a.name,
      type: a.type,
      size: a.size,
    }));

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText || '(anexo)',
      created_at: new Date().toISOString(),
      metadata: attachmentMeta.length > 0 ? { attachments: attachmentMeta } : undefined,
    };

    shouldAutoScroll.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);
    setLastFailedMessage(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          attachments: currentAttachments.map(a => ({
            name: a.name,
            type: a.type,
            size: a.size,
            data: a.data,
            mediaType: a.mediaType,
          })),
        }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `limit-${Date.now()}`,
            role: 'assistant',
            content: `Você atingiu o limite de ${data.limit} mensagens do plano gratuito este mês. Faça upgrade para o plano Pro para mensagens ilimitadas.`,
            created_at: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      if (res.status === 429) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ratelimit-${Date.now()}`,
            role: 'assistant',
            content: 'Muitas mensagens seguidas. Aguarde alguns segundos e tente novamente.',
            created_at: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      // Handle SSE streaming
      const streamingId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: streamingId, role: 'assistant', content: '', created_at: new Date().toISOString() },
      ]);
      setIsLoading(false); // Hide typing indicator, show streaming message

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              if (event.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingId ? { ...m, content: event.error } : m,
                  ),
                );
                break;
              }
              if (event.tool_executing) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingId
                      ? {
                          ...m,
                          toolActions: [
                            ...(m.toolActions || []),
                            { tool: event.tool_executing, status: 'executing' as const },
                          ],
                        }
                      : m,
                  ),
                );
              }
              if (event.tool_executed) {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== streamingId) return m;
                    const actions = (m.toolActions || []).map((a) =>
                      a.tool === event.tool_executed
                        ? { ...a, status: (event.success ? 'success' : 'error') as ToolAction['status'], description: event.description }
                        : a,
                    );
                    return { ...m, toolActions: actions };
                  }),
                );
              }
              if (event.token) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingId ? { ...m, content: m.content + event.token } : m,
                  ),
                );
              }
              if (event.done && event.userMessage) {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id === userMessage.id) return { ...event.userMessage, metadata: userMessage.metadata };
                    if (m.id === streamingId && event.assistantMessage) return event.assistantMessage;
                    return m;
                  }),
                );
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Desculpe, não consegui processar sua mensagem. Verifique sua conexão e tente novamente.',
          created_at: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
      setLastFailedMessage(messageText);
    }
  }

  function handleSuggestionSelect(text: string) {
    sendMessage(text);
  }

  async function clearChat() {
    try {
      await fetch('/api/chat/history', { method: 'DELETE' });
    } catch {
      // best effort
    }
    setMessages([]);
    toast.success('Chat limpo');
  }

  const showSuggestions = isHistoryLoaded && messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length > 0 && (
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
          <span className="text-[10px] text-muted-foreground">
            {messages.filter(m => m.role === 'user').length} mensagen{messages.filter(m => m.role === 'user').length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearChat}
            aria-label="Iniciar novo chat"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" />
            Novo chat
          </button>
        </div>
      )}
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        {showSuggestions && <ChatSuggestions onSelect={handleSuggestionSelect} />}
        <div className="mx-auto max-w-3xl">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} createdAt={msg.created_at} toolActions={msg.toolActions} metadata={msg.metadata} />
          ))}
          <div aria-live="polite" aria-atomic="true">
            {isLoading && <TypingIndicator />}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
      {lastFailedMessage && !isLoading && (
        <div className="flex shrink-0 justify-center border-t px-4 py-2">
          <button
            onClick={() => sendMessage(lastFailedMessage)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <RotateCcw className="h-3 w-3" />
            Tentar novamente
          </button>
        </div>
      )}
      <div className="shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => sendMessage()}
          disabled={isLoading}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
        />
      </div>
    </div>
  );
}
