'use client';

import { useState } from 'react';
import { Mail, Clock, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/toast';

const FAQ = [
  {
    q: 'Como importar meu extrato bancário?',
    a: 'Vá em Transações e clique no botão "Importar". Aceitamos arquivos CSV e OFX dos principais bancos.',
  },
  {
    q: 'Como cancelar minha assinatura?',
    a: 'Acesse Configurações > Assinatura e clique em "Cancelar plano". Você mantém acesso até o fim do período pago.',
  },
  {
    q: 'Meus dados financeiros estão seguros?',
    a: 'Sim. Usamos criptografia de ponta a ponta e não armazenamos suas credenciais bancárias. A conexão é feita via Open Finance regulado pelo Banco Central.',
  },
  {
    q: 'Como funciona a categorização automática?',
    a: 'A Cleo usa inteligência artificial para categorizar suas transações automaticamente. Você pode corrigir manualmente e o sistema aprende com suas preferências.',
  },
  {
    q: 'Posso usar a Cleo em mais de um dispositivo?',
    a: 'Sim! A Cleo é acessível pelo navegador em qualquer dispositivo. Basta fazer login com sua conta.',
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Erro ao enviar');
      }
      toast.success('Mensagem enviada! Responderemos em até 24h.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Como podemos ajudar?
        </p>
      </div>

      {/* Contact info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <Mail className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">E-mail</p>
            <p className="text-sm text-muted-foreground">contato@cleo.app</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <Clock className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Horário</p>
            <p className="text-sm text-muted-foreground">Seg-Sex, 9h-18h</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <MessageSquare className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Chat com Cleo</p>
            <p className="text-sm text-muted-foreground">Disponível 24h</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Perguntas Frequentes</h2>
        </div>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-lg border bg-card">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium"
              >
                {item.q}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Enviar Mensagem</h2>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Seu nome"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
              Mensagem
            </label>
            <textarea
              id="message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Descreva como podemos ajudar..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
