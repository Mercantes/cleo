'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PluggyConnect } from 'react-pluggy-connect';
import { Button } from '@/components/ui/button';
import { Landmark, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';

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
        throw new Error('Falha ao importar dados bancários');
      }

      toast('Banco conectado com sucesso!');
      router.refresh();
    } catch {
      setError('Banco conectado, mas houve um erro ao importar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleError() {
    setConnectToken(null);
    setIsLoading(false);
    setError('A conexão foi cancelada ou falhou. Tente novamente.');
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
          onSuccess={handleSuccess}
          onError={handleError}
          onClose={() => {
            setConnectToken(null);
            setIsLoading(false);
          }}
        />
      )}
    </>
  );
}
