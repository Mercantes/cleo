'use client';

import { useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string;
  mediaType: string;
  previewUrl?: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

const MAX_LENGTH = 4000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 3;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  attachments,
  onAttachmentsChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOverLimit = value.length > MAX_LENGTH;
  const showCounter = value.length > MAX_LENGTH * 0.75;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || attachments.length > 0) && !disabled) {
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

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;

    e.preventDefault();
    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_FILES} arquivos por mensagem`);
      return;
    }

    for (const item of imageItems.slice(0, remaining)) {
      const file = item.getAsFile();
      if (!file) continue;
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Imagem colada excede 10MB`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const name = `imagem-colada-${Date.now()}.${file.type.split('/')[1] || 'png'}`;

        const attachment: Attachment = {
          name,
          type: file.type,
          size: file.size,
          data: base64,
          mediaType: file.type,
          previewUrl: result,
        };

        onAttachmentsChange([...attachments, attachment]);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_FILES} arquivos por mensagem`);
      e.target.value = '';
      return;
    }

    const filesToProcess = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Apenas ${remaining} arquivo(s) adicionado(s). Limite: ${MAX_FILES}`);
    }

    for (const file of filesToProcess) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`Tipo não suportado: ${file.name}. Use JPEG, PNG, WebP, GIF ou PDF.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} excede 10MB`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get raw base64
        const base64 = result.split(',')[1];
        const isImage = file.type.startsWith('image/');

        const attachment: Attachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          mediaType: file.type,
          previewUrl: isImage ? result : undefined,
        };

        onAttachmentsChange([...attachments, attachment]);
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  }

  function removeAttachment(index: number) {
    const updated = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updated);
  }

  return (
    <div className="border-t bg-background p-4">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div
              key={`${att.name}-${i}`}
              className="group/att relative flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1.5"
            >
              {att.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.previewUrl} alt={att.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex flex-col">
                <span className="max-w-[80px] truncate text-xs font-medium sm:max-w-[120px]">
                  {att.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatFileSize(att.size)}
                </span>
              </div>
              <button
                onClick={() => removeAttachment(i)}
                aria-label={`Remover ${att.name}`}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachments.length >= MAX_FILES}
          aria-label="Anexar arquivo"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 sm:h-9 sm:w-9"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          maxLength={MAX_LENGTH}
          placeholder={disabled ? 'Aguarde a resposta...' : 'Pergunte algo sobre suas finanças...'}
          aria-label="Mensagem para a Cleo"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border bg-muted/50 px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={disabled || (!value.trim() && attachments.length === 0) || isOverLimit}
          aria-label="Enviar mensagem"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {showCounter && (
        <p
          className={`mt-1 text-right text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {value.length.toLocaleString('pt-BR')}/{MAX_LENGTH.toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  );
}
