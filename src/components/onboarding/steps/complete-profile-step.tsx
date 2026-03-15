'use client';

import { useState } from 'react';
import { UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCPF, stripCPF, isValidCPF } from '@/lib/utils/cpf';

interface CompleteProfileStepProps {
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
}

export function CompleteProfileStep({ onComplete, onSkip, userName }: CompleteProfileStepProps) {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const digits = stripCPF(cpf);
    if (!isValidCPF(digits)) {
      setError('CPF inválido. Verifique o número digitado.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: digits }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'CPF_ALREADY_EXISTS') {
          setError('Este CPF já está cadastrado em outra conta.');
          return;
        }
        throw new Error();
      }

      onComplete();
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  const greeting = userName ? `${userName}, complete seu perfil` : 'Complete seu perfil';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <UserCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{greeting}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Precisamos do seu CPF para personalizar sua experiência financeira.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="cpf" className="text-sm font-medium">
            CPF
          </label>
          <Input
            id="cpf"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            maxLength={14}
            aria-invalid={!!error}
            aria-describedby={error ? 'cpf-error' : undefined}
            disabled={isSaving}
          />
          {error && (
            <p id="cpf-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Usado apenas para identificação. Seus dados são protegidos.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar
          </Button>
          <Button type="button" variant="ghost" onClick={onSkip} className="w-full text-muted-foreground" disabled={isSaving}>
            Pular por agora
          </Button>
        </div>
      </form>
    </div>
  );
}
