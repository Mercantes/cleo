'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';

const DEFAULT_SUGGESTIONS = [
  'Quanto gastei esse mês?',
  'Minhas assinaturas estão pesando?',
  'Como posso economizar?',
  'Qual meu saldo atual?',
];

interface Insight {
  type: string;
  title: string;
  message: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia! Sou a Cleo';
  if (hour < 18) return 'Boa tarde! Sou a Cleo';
  return 'Boa noite! Sou a Cleo';
}

function getSubtext(insights: Insight[]): string {
  const warning = insights.find((i) => i.type === 'warning');
  if (warning) return warning.title;
  const celebration = insights.find((i) => i.type === 'celebration');
  if (celebration) return celebration.title;
  return 'Sua assistente financeira. Como posso ajudar?';
}

function insightToSuggestion(insight: Insight): string {
  if (insight.type === 'warning') return `Analise: ${insight.title.toLowerCase()}`;
  if (insight.type === 'tip') return 'Me dê dicas para economizar';
  if (insight.type === 'celebration') return 'Como estou indo com minhas metas?';
  if (insight.type === 'suggestion') return 'O que posso melhorar nas finanças?';
  return 'Me ajude a organizar minhas finanças';
}

interface ChatSuggestionsProps {
  onSelect: (text: string) => void;
}

export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const { data } = useApi<{ insights: Insight[] }>('/api/insights');
  const insights = data?.insights || [];

  const { suggestions, subtext } = useMemo(() => {
    if (insights.length === 0) {
      return { suggestions: DEFAULT_SUGGESTIONS, subtext: 'Sua assistente financeira. Como posso ajudar?' };
    }
    const dynamic = insights.slice(0, 2).map((i) => insightToSuggestion(i));
    const unique = [...new Set([...dynamic, ...DEFAULT_SUGGESTIONS])].slice(0, 4);
    return { suggestions: unique, subtext: getSubtext(insights) };
  }, [insights]);

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="text-center">
        <Image
          src="/logo.png"
          alt="Cleo"
          width={56}
          height={56}
          className="mx-auto rounded-xl"
        />
        <h2 className="mt-2 text-lg font-semibold">{getGreeting()}</h2>
        <p className="text-sm text-muted-foreground">{subtext}</p>
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
