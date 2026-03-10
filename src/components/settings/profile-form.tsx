'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProfileFormProps {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      });
      setFeedback(res.ok ? 'saved' : 'error');
    } catch {
      setFeedback('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="text-sm font-medium">Nome</label>
        <Input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
          maxLength={100}
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="text-sm font-medium">Email</label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          disabled
          className="mt-1"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
        {feedback === 'saved' && <span className="text-sm text-green-600">Salvo com sucesso!</span>}
        {feedback === 'error' && <span className="text-sm text-red-600">Erro ao salvar. Tente novamente.</span>}
      </div>
    </div>
  );
}
