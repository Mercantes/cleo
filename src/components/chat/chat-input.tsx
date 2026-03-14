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

const MAX_LENGTH = 4000;

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOverLimit = value.length > MAX_LENGTH;
  const showCounter = value.length > MAX_LENGTH * 0.75;

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
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          placeholder="Pergunte algo sobre suas finanças..."
          aria-label="Mensagem para a Cleo"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={disabled || !value.trim() || isOverLimit}
          aria-label="Enviar mensagem"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {showCounter && (
        <p className={`mt-1 text-right text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
          {value.length.toLocaleString('pt-BR')}/{MAX_LENGTH.toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}
