'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatSuggestions } from './chat-suggestions';
import { TypingIndicator } from './typing-indicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/chat/history');
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        // Start with empty chat
      } finally {
        setIsHistoryLoaded(true);
      }
    }
    loadHistory();
  }, []);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (res.status === 429) {
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
                    if (m.id === userMessage.id) return event.userMessage;
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
    }
  }

  function handleSuggestionSelect(text: string) {
    sendMessage(text);
  }

  const showSuggestions = isHistoryLoaded && messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {showSuggestions && <ChatSuggestions onSelect={handleSuggestionSelect} />}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} createdAt={msg.created_at} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => sendMessage()}
        disabled={isLoading}
      />
    </div>
  );
}
