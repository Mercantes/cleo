'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <p className="font-medium">Mensagem enviada!</p>
        <p className="text-sm text-muted-foreground">
          Obrigado pelo contato. Responderemos em breve.
        </p>
        <Button variant="outline" size="sm" onClick={() => setStatus('idle')} className="mt-2">
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="contact-name" className="mb-1 block text-sm font-medium">
          Nome
        </label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          required
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1 block text-sm font-medium">
          Mensagem
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Como podemos ajudar?"
          required
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-500">Erro ao enviar. Tente novamente.</p>
      )}
      <Button type="submit" disabled={status === 'sending'} className="w-full gap-2">
        {status === 'sending' ? 'Enviando...' : 'Enviar mensagem'}
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
