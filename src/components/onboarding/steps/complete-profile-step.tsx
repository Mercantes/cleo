'use client';

import { useState } from 'react';
import { UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCPF, stripCPF, isValidCPF } from '@/lib/utils/cpf';
import Link from 'next/link';

interface CompleteProfileStepProps {
  onComplete: () => void;
  onSkip: () => void;
  userName?: string;
}

export function CompleteProfileStep({ onComplete, onSkip, userName }: CompleteProfileStepProps) {
  const [cpf, setCpf] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
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
      setError('CPF invalido. Verifique o numero digitado.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: digits,
          referralCode: referralCode || undefined,
          analyticsConsent,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'CPF_ALREADY_EXISTS') {
          setError('Este CPF ja esta cadastrado em outra conta.');
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
          Precisamos de mais alguns dados para configurar sua conta.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Leva menos de 1 minuto
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
            aria-describedby={error ? 'cpf-error' : 'cpf-hint'}
            disabled={isSaving}
          />
          {error && (
            <p id="cpf-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <p id="cpf-hint" className="text-xs text-muted-foreground">
            Digite seu CPF com ou sem formatacao (ex: 12345678900 ou 123.456.789-00)
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="referral" className="text-sm font-medium">
            Codigo de indicacao <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id="referral"
            placeholder="CLEO-XXXXXXXX"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            disabled={isSaving}
          />
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={analyticsConsent}
              onClick={() => setAnalyticsConsent(!analyticsConsent)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                analyticsConsent ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  analyticsConsent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              Concordo com o uso de analytics para ajudar a melhorar a Cleo
            </span>
          </label>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Ao continuar, voce concorda com os{' '}
          <Link href="/terms" className="text-primary hover:underline" target="_blank">
            Termos de Servico
          </Link>{' '}
          e a{' '}
          <Link href="/privacy" className="text-primary hover:underline" target="_blank">
            Politica de Privacidade
          </Link>
        </p>

        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSaving}
          >
            Pular
          </button>
        </div>
      </form>
    </div>
  );
}
