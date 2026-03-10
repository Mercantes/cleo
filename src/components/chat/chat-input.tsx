'use client';

import { useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  }

  function handleInput() {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }

  return (
    <div className="flex items-end gap-2 border-t bg-background p-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte algo sobre suas finanças..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensagem"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
