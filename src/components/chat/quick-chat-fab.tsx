'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, X, Send, Loader2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ALL_PROMPTS = [
  'Quanto gastei esse mês?',
  'Como estão minhas metas?',
  'Me dê dicas para economizar',
  'Qual minha maior despesa?',
  'Estou gastando mais que o normal?',
  'Quanto preciso economizar por dia?',
  'Resuma minhas finanças da semana',
  'Compare meus gastos com mês passado',
];

function pickPrompts(count: number): string[] {
  const shuffled = [...ALL_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function QuickChatFab() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickPrompts] = useState(() => pickPrompts(3));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: QuickMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) {
        const err = new Error('Failed');
        (err as Error & { status: number }).status = res.status;
        throw err;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                const content = assistantContent;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content };
                  return updated;
                });
              }
            } catch {
              // skip parse errors
            }
          }
        }
      }
    } catch (err) {
      let errorMsg = 'Desculpe, não consegui responder. Tente novamente.';
      const status = (err as Error & { status?: number })?.status;
      if (status === 429) {
        errorMsg = 'Muitas requisições. Aguarde um momento.';
      } else if (err instanceof TypeError) {
        errorMsg = 'Sem conexão. Verifique sua internet.';
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // Don't render on chat page
  if (pathname === '/chat') return null;

  return (
    <>
      {/* FAB Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6 md:h-14 md:w-14"
          aria-label="Perguntar à Cleo"
        >
          <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      )}

      {/* Quick Chat Panel */}
      {open && (
        <div className="fixed bottom-20 left-2 right-2 z-40 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:left-auto sm:right-4 sm:w-96 md:bottom-6 md:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold">Cleo</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  router.push('/chat');
                  setOpen(false);
                }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Abrir chat completo"
                title="Chat completo"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: '320px', minHeight: '200px' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-muted-foreground">Pergunte qualquer coisa sobre suas finanças</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : 'bg-muted',
                    )}
                  >
                    {msg.content || (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="max-w-[85%] rounded-2xl bg-muted px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte à Cleo..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-full bg-primary p-1.5 text-primary-foreground transition-opacity disabled:opacity-30"
                aria-label="Enviar"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
