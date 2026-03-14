'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormSubmit } from '@/hooks/use-form-submit';

interface ProfileFormProps {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const { submit, saving, feedback } = useFormSubmit({
    successMessage: 'Perfil salvo com sucesso',
  });

  const handleSave = () =>
    submit(() =>
      fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      }),
    );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="profile-name" className="text-sm font-medium">Nome</label>
          <span className="text-xs text-muted-foreground">{name.length}/100</span>
        </div>
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
        <p className="mt-1 text-xs text-muted-foreground">O email não pode ser alterado.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
        <span aria-live="polite" className="text-sm">
          {feedback === 'saved' && <span className="text-green-600 dark:text-green-400">Salvo com sucesso!</span>}
          {feedback === 'error' && <span className="text-red-600 dark:text-red-400">Erro ao salvar. Tente novamente.</span>}
        </span>
      </div>
    </div>
  );
}
