'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Landmark, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';

// PluggyConnect uses zoid (iframe-based) which requires browser APIs.
// Must be loaded client-side only to avoid SSR issues in Next.js.
const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then((mod) => mod.PluggyConnect),
  { ssr: false },
);

export function ConnectBankButton() {
  const router = useRouter();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pluggy/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        if (body.error === 'TIER_LIMIT_REACHED') {
          setError(`Você atingiu o limite de ${body.limit} conexão(ões) bancária(s) no plano gratuito.`);
          setIsLoading(false);
          return;
        }

        if (body.error === 'PLUGGY_NOT_CONFIGURED') {
          setError('Conexão bancária não está disponível no momento. Tente novamente mais tarde.');
          setIsLoading(false);
          return;
        }

        if (response.status === 502) {
          setError('Erro de configuração na conexão bancária. Contate o suporte.');
          setIsLoading(false);
          return;
        }

        throw new Error('Falha ao iniciar conexão');
      }

      const data = await response.json();
      setConnectToken(data.accessToken);
    } catch {
      setError('Não foi possível conectar. Tente novamente.');
      setIsLoading(false);
    }
  }

  async function handleSuccess(data: { item: { id: string } }) {
    setConnectToken(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/pluggy/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: data.item.id }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (body.error === 'TIER_LIMIT_REACHED') {
          setError(`Limite de conexões atingido no plano gratuito.`);
        } else {
          setError('Banco conectado, mas houve um erro ao importar. Tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      toast(`Banco conectado! ${result.accountCount} conta(s), ${result.transactionCount} transações importadas.`);
      router.refresh();
    } catch {
      setError('Banco conectado, mas houve um erro ao importar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleError(err: { message?: string; data?: unknown } | undefined) {
    console.error('[pluggy-widget] onError:', JSON.stringify(err, null, 2));
    setConnectToken(null);
    setIsLoading(false);

    const code = err?.message || '';
    if (code === 'TRIAL_CLIENT_ITEM_CREATE_NOT_ALLOWED') {
      setError('Conta Pluggy em modo trial. Contate o suporte para ativar conexões bancárias.');
      return;
    }

    const msg = code || 'A conexão foi cancelada ou falhou.';
    setError(`Erro: ${msg}`);
  }

  return (
    <>
      <Button onClick={handleConnect} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Landmark className="mr-2 h-4 w-4" />
        )}
        {isLoading ? 'Conectando...' : 'Conectar banco'}
      </Button>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={process.env.NEXT_PUBLIC_PLUGGY_SANDBOX === 'true'}
          onSuccess={handleSuccess}
          onError={handleError}
          onLoadError={(err: unknown) => {
            console.error('[pluggy-widget] onLoadError:', err);
            setConnectToken(null);
            setIsLoading(false);
            setError('Erro ao carregar widget bancário. Tente novamente.');
          }}
          onEvent={(event: unknown) => console.log('[pluggy-widget] onEvent:', event)}
          onOpen={() => console.log('[pluggy-widget] onOpen: widget opened')}
          onClose={() => {
            console.log('[pluggy-widget] onClose: widget closed');
            setConnectToken(null);
            setIsLoading(false);
          }}
        />
      )}
    </>
  );
}
