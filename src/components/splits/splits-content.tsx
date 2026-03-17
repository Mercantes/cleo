'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useHideValues, HIDDEN_VALUE } from '@/hooks/use-hide-values';
import { useApi } from '@/hooks/use-api';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
}

interface ExpenseSplit {
  id: string;
  description: string;
  total_amount: number;
  transaction_id: string | null;
  created_at: string;
  split_participants: Participant[];
}

export function SplitsContent() {
  const [hideValues] = useHideValues();
  const fmt = (v: number) => (hideValues ? HIDDEN_VALUE : formatCurrency(v));
  const { data, isLoading, mutate } = useApi<{ splits: ExpenseSplit[] }>('/api/splits');

  const [showForm, setShowForm] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [participants, setParticipants] = useState([
    { name: '', amount: '' },
    { name: '', amount: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const splits = data?.splits || [];
  const totalOwed = splits.reduce((sum, s) => {
    const unpaid = s.split_participants.filter((p) => !p.is_paid).reduce((a, p) => a + Number(p.amount), 0);
    return sum + unpaid;
  }, 0);

  useEffect(() => {
    if (showForm) {
      requestAnimationFrame(() => setFormVisible(true));
    } else {
      setFormVisible(false);
    }
  }, [showForm]);

  // Escape to close
  useEffect(() => {
    if (!showForm) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowForm(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showForm]);

  function closeForm() {
    setShowForm(false);
    setTimeout(() => {
      setDescription('');
      setTotalAmount('');
      setParticipants([{ name: '', amount: '' }, { name: '', amount: '' }]);
    }, 200);
  }

  function addParticipant() {
    setParticipants([...participants, { name: '', amount: '' }]);
  }

  function removeParticipant(idx: number) {
    if (participants.length <= 2) return;
    setParticipants(participants.filter((_, i) => i !== idx));
  }

  function splitEvenly() {
    const total = parseFloat(totalAmount);
    if (!total || participants.length === 0) return;
    const each = (total / participants.length).toFixed(2);
    setParticipants(participants.map((p) => ({ ...p, amount: each })));
  }

  async function handleSave() {
    if (!description.trim() || !totalAmount) return;
    const total = parseFloat(totalAmount);
    const parts = participants
      .filter((p) => p.name.trim() && p.amount)
      .map((p) => ({ name: p.name.trim(), amount: parseFloat(p.amount) }));

    if (parts.length < 2) {
      toast.error('Mínimo de 2 participantes');
      return;
    }

    const partSum = parts.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(partSum - total) > 0.02) {
      toast.error(`Soma dos valores (${formatCurrency(partSum)}) não bate com o total (${formatCurrency(total)})`);
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
          participants: parts,
        }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      closeForm();
      toast.success('Despesa dividida criada');
    } catch {
      toast.error('Erro ao criar divisão');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePaid(participantId: string, isPaid: boolean) {
    // Optimistic update
    if (data) {
      mutate({
        splits: splits.map((s) => ({
          ...s,
          split_participants: s.split_participants.map((p) =>
            p.id === participantId ? { ...p, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null } : p,
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
      await mutate();
    } catch {
      await mutate();
      toast.error('Erro ao atualizar pagamento');
    }
  }

  async function handleDelete(splitId: string) {
    if (data) {
      mutate({ splits: splits.filter((s) => s.id !== splitId) }, false);
    }
    try {
      const res = await fetch(`/api/splits?id=${splitId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await mutate();
      toast.success('Divisão removida');
    } catch {
      await mutate();
      toast.error('Erro ao remover divisão');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {splits.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Divisões ativas</p>
            <p className="text-xl font-bold">{splits.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total pendente</p>
            <p className={cn('text-xl font-bold', totalOwed > 0 ? 'text-amber-600' : 'text-emerald-600')}>
              {fmt(totalOwed)}
            </p>
          </div>
        </div>
      )}

      {splits.length === 0 && !showForm ? (
        <div className="space-y-6">
          <EmptyState
            icon={Users}
            title="Nenhuma despesa dividida"
            description="Divida contas com amigos e família e acompanhe quem já pagou."
          />
          <div className="flex justify-center">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Dividir despesa
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Splits list */}
          <div className="space-y-4">
            {splits.map((split) => {
              const paidCount = split.split_participants.filter((p) => p.is_paid).length;
              const allPaid = paidCount === split.split_participants.length;

              return (
                <div key={split.id} className={cn('rounded-xl border bg-card p-4', allPaid && 'opacity-60')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{split.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(split.total_amount)} · {new Date(split.created_at).toLocaleDateString('pt-BR')}
                        {allPaid && ' · Todos pagaram'}
                        {!allPaid && (() => {
                          const days = Math.floor((Date.now() - new Date(split.created_at).getTime()) / 86400000);
                          if (days >= 7) return <span className={days >= 30 ? ' text-red-500 font-medium' : ' text-amber-600'}> · há {days >= 30 ? `${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? 'mês' : 'meses'}` : `${days}d`}</span>;
                          return null;
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {paidCount}/{split.split_participants.length}
                      </span>
                      <button
                        onClick={() => handleDelete(split.id)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Payment progress bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(paidCount / split.split_participants.length) * 100}%` }}
                    />
                  </div>

                  {/* Participants */}
                  <div className="mt-2 space-y-1.5">
                    {split.split_participants.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleTogglePaid(p.id, !p.is_paid)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/50"
                      >
                        {p.is_paid ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={cn('flex-1 text-sm', p.is_paid && 'line-through text-muted-foreground')}>
                          {p.name}
                        </span>
                        <span className={cn('text-sm font-medium', p.is_paid && 'text-muted-foreground')}>
                          {fmt(p.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova divisão
            </Button>
          </div>
        </>
      )}

      {/* Add modal */}
      {showForm && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200',
            formVisible ? 'bg-black/50' : 'bg-black/0',
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div
            className={cn(
              'w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4 transition-all duration-200 max-h-[80vh] overflow-y-auto',
              formVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Dividir despesa</h3>
              <button onClick={closeForm} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Jantar no restaurante"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Valor total (R$)</label>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={splitEvenly} className="mb-0.5">
                  Dividir igual
                </Button>
              </div>

              {/* Participants */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Participantes</label>
                <div className="space-y-2">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nome"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...participants];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setParticipants(next);
                        }}
                        className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="R$"
                        value={p.amount}
                        onChange={(e) => {
                          const next = [...participants];
                          next[idx] = { ...next[idx], amount: e.target.value };
                          setParticipants(next);
                        }}
                        className="w-24 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="0"
                        step="0.01"
                      />
                      {participants.length > 2 && (
                        <button
                          onClick={() => removeParticipant(idx)}
                          className="rounded-md p-1 text-muted-foreground hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addParticipant}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar participante
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={closeForm}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={handleSave}
                disabled={saving || !description.trim() || !totalAmount}
              >
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {saving ? 'Criando...' : 'Criar divisão'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
