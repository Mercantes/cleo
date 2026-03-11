'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

const DEFAULT_SUGGESTIONS = [
  'Quanto gastei esse mês?',
  'Minhas assinaturas estão pesando?',
  'Como posso economizar?',
  'Qual meu saldo atual?',
];

interface Insight {
  type: string;
  message: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia! Sou a Cleo';
  if (hour < 18) return 'Boa tarde! Sou a Cleo';
  return 'Boa noite! Sou a Cleo';
}

function insightToSuggestion(insight: Insight): string {
  if (insight.type === 'warning') return 'Estou gastando rápido demais?';
  if (insight.type === 'tip') return 'Me dê dicas para economizar';
  if (insight.type === 'celebration') return 'Como estou indo com minhas metas?';
  if (insight.type === 'suggestion') return 'O que posso melhorar nas finanças?';
  return 'Me ajude a organizar minhas finanças';
}

interface ChatSuggestionsProps {
  onSelect: (text: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);

  useEffect(() => {
    fetchWithTimeout('/api/insights')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.insights?.length > 0) {
          const dynamic = data.insights
            .slice(0, 2)
            .map((i: Insight) => insightToSuggestion(i));
          const unique = [...new Set([...dynamic, ...DEFAULT_SUGGESTIONS])].slice(0, 4);
          setSuggestions(unique);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="text-center">
        <Image
          src="/favicon.svg"
          alt="Cleo"
          width={56}
          height={56}
          className="mx-auto rounded-xl"
        />
        <h2 className="mt-2 text-lg font-semibold">{getGreeting()}</h2>
        <p className="text-sm text-muted-foreground">Sua assistente financeira. Como posso ajudar?</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            onClick={() => onSelect(suggestion)}
            aria-label={`Perguntar: ${suggestion}`}
            className="rounded-full"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
