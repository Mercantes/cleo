'use client';

import { ChallengesContent } from '@/components/challenges/challenges-content';
import { ProGate } from '@/components/paywall/pro-gate';

export default function ChallengesPage() {
  return (
    <div className="space-y-6">
      <div>
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
