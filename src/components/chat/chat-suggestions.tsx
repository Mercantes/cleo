'use client';

const SUGGESTIONS = [
  'Quanto gastei esse mês?',
  'Minhas assinaturas estão pesando?',
  'Como posso economizar?',
  'Qual meu saldo atual?',
];

interface ChatSuggestionsProps {
  onSelect: (text: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="text-center">
        <p className="text-4xl">🤖</p>
        <h2 className="mt-2 text-lg font-semibold">Olá! Sou a Cleo</h2>
        <p className="text-sm text-muted-foreground">Sua assistente financeira. Como posso ajudar?</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
