import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ChallengesContent } from '@/components/challenges/challenges-content';
import { ProGate } from '@/components/paywall/pro-gate';

export const metadata: Metadata = { title: 'Desafios' };

export default function ChallengesPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/goals"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          Metas & Orçamentos
        </Link>
        <h1 className="text-2xl font-bold">Desafios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete desafios financeiros e ganhe XP para subir de nível
        </p>
      </div>
      <ProGate feature="Desafios e gamificação">
        <ChallengesContent />
      </ProGate>
    </div>
  );
}
