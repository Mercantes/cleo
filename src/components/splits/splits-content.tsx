'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, Check, Users, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/components/ui/toast';

interface Participant {
  id?: string;
  name: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string | null;
}

interface Split {
  id: string;
  description: string;
  total_amount: number;
  transaction_id: string | null;
  created_at: string;
  split_participants: Participant[];
}

export function SplitsContent() {
  const searchParams = useSearchParams();
  const { data, mutate } = useApi<{ splits: Split[] }>('/api/splits');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-open form when coming from a transaction
  const prefillDescription = searchParams.get('description') || '';
  const prefillAmount = searchParams.get('amount') || '';
  const prefillTxId = searchParams.get('txId') || '';

  useEffect(() => {
    if (prefillDescription && prefillAmount) {
      setShowForm(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const splits = data?.splits || [];

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta divisão?')) return;
    const prev = data;
    mutate({ splits: (data?.splits || []).filter(s => s.id !== id) }, false);
    try {
      const res = await fetch(`/api/splits?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Divisão removida');
    } catch {
      mutate(prev);
      toast.error('Erro ao remover divisão');
    }
  }, [data, mutate]);

  const handleTogglePaid = useCallback(async (participantId: string, isPaid: boolean) => {
    const prev = data;
    // Optimistic update
    if (data?.splits) {
      mutate({
        splits: data.splits.map(s => ({
          ...s,
          split_participants: s.split_participants.map(p =>
            p.id === participantId ? { ...p, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null } : p
          ),
        })),
      }, false);
    }
    try {
      const res = await fetch('/api/splits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, isPaid }),
      });
      if (!res.ok) throw new Error();
      toast.success(isPaid ? 'Marcado como pago' : 'Desmarcado');
    } catch {
      mutate(prev);
      toast.error('Erro ao atualizar');
    }
  }, [data, mutate]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        Nova divisão
      </button>

      {showForm && (
        <NewSplitForm
          initialDescription={prefillDescription}
          initialAmount={prefillAmount}
          transactionId={prefillTxId}
          onCreated={() => { setShowForm(false); mutate(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {splits.length === 0 && !showForm && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma divisão criada. Clique em &quot;Nova divisão&quot; para começar.
          </p>
        </div>
      )}

      {splits.map(split => {
        const paidCount = split.split_participants.filter(p => p.is_paid).length;
        const totalParticipants = split.split_participants.length;
        const isExpanded = expandedId === split.id;

        return (
          <div key={split.id} className="rounded-lg border bg-card">
            <button
              onClick={() => setExpandedId(isExpanded ? null : split.id)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{split.description}</p>
                <p className="text-sm text-muted-foreground">
                  R$ {Number(split.total_amount).toFixed(2)} · {paidCount}/{totalParticipants} pagos
                </p>
              </div>
              <div className="flex items-center gap-2">
                {paidCount === totalParticipants && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Quitado
                  </span>
                )}
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-3">
                <div className="space-y-2">
                  {split.split_participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => p.id && handleTogglePaid(p.id, !p.is_paid)}
                          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                            p.is_paid
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-muted-foreground/30 hover:border-primary'
                          }`}
                        >
                          {p.is_paid && <Check className="h-3 w-3" />}
                        </button>
                        <span className={p.is_paid ? 'text-muted-foreground line-through' : ''}>
                          {p.name}
                        </span>
                      </div>
                      <span className="font-medium">R$ {Number(p.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const unpaid = split.split_participants.filter(p => !p.is_paid);
                      if (unpaid.length === 0) { toast('Todos já pagaram!'); return; }
                      const lines = unpaid.map(p => `• ${p.name}: R$ ${Number(p.amount).toFixed(2)}`);
                      const text = `💰 ${split.description}\n\n${lines.join('\n')}\n\nTotal: R$ ${Number(split.total_amount).toFixed(2)}`;
                      navigator.clipboard.writeText(text).then(() => toast.success('Cobrança copiada!'));
                    }}
                    className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Share2 className="h-3 w-3" />
                    Copiar cobrança
                  </button>
                  <button
                    onClick={() => handleDelete(split.id)}
                    className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewSplitForm({
  initialDescription = '',
  initialAmount = '',
  transactionId = '',
  onCreated,
  onCancel,
}: {
  initialDescription?: string;
  initialAmount?: string;
  transactionId?: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [totalAmount, setTotalAmount] = useState(initialAmount);
  const [participants, setParticipants] = useState<{ name: string; amount: string }[]>([
    { name: '', amount: '' },
    { name: '', amount: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const addParticipant = () => {
    setParticipants(prev => [...prev, { name: '', amount: '' }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length <= 2) return;
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: 'name' | 'amount', value: string) => {
    setParticipants(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const splitEvenly = () => {
    const total = parseFloat(totalAmount);
    if (!total || participants.length === 0) return;
    const each = (total / participants.length).toFixed(2);
    setParticipants(prev => prev.map(p => ({ ...p, amount: each })));
  };

  const handleSubmit = async () => {
    const total = parseFloat(totalAmount);
    if (!description.trim() || !total || total <= 0) {
      toast.warning('Preencha descrição e valor total');
      return;
    }

    const validParticipants = participants
      .filter(p => p.name.trim() && parseFloat(p.amount) > 0)
      .map(p => ({ name: p.name.trim(), amount: parseFloat(p.amount), is_paid: false }));

    if (validParticipants.length < 2) {
      toast.warning('Adicione pelo menos 2 participantes');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          totalAmount: total,
          participants: validParticipants,
          ...(transactionId && { transactionId }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Erro ao criar divisão');
        return;
      }

      toast.success('Divisão criada!');
      onCreated();
    } catch {
      toast.error('Erro ao criar divisão');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div>
        <label htmlFor="split-desc" className="mb-1 block text-sm font-medium">Descrição</label>
        <input
          id="split-desc"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Jantar no restaurante"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="split-total" className="mb-1 block text-sm font-medium">Valor total</label>
        <input
          id="split-total"
          type="number"
          value={totalAmount}
          onChange={e => setTotalAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Participantes</label>
          <button
            onClick={splitEvenly}
            className="text-xs text-primary hover:underline"
            type="button"
          >
            Dividir igualmente
          </button>
        </div>

        <div className="space-y-2">
          {participants.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={p.name}
                onChange={e => updateParticipant(i, 'name', e.target.value)}
                placeholder="Nome"
                aria-label={`Nome do participante ${i + 1}`}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={p.amount}
                onChange={e => updateParticipant(i, 'amount', e.target.value)}
                placeholder="R$"
                step="0.01"
                min="0"
                aria-label={`Valor do participante ${i + 1}`}
                className="w-28 rounded-md border bg-background px-3 py-2 text-sm"
              />
              {participants.length > 2 && (
                <button
                  onClick={() => removeParticipant(i)}
                  className="text-muted-foreground hover:text-red-500"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addParticipant}
          className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
          type="button"
        >
          <Plus className="h-3 w-3" />
          Adicionar participante
        </button>
      </div>

      <div className="flex justify-end gap-2 border-t pt-3">
        <button
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Criar divisão'}
        </button>
      </div>
    </div>
  );
}
