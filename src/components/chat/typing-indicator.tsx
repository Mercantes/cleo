'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
        <span className="text-xs text-muted-foreground">Cleo está digitando</span>
        <span className="flex gap-0.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
