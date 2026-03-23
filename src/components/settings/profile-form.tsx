'use client';

import { useState, useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFormSubmit } from '@/hooks/use-form-submit';

interface ProfileFormProps {
  initialName: string;
  email: string;
  avatarUrl?: string | null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfileForm({ initialName, email, avatarUrl }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(avatarUrl || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submit, saving, feedback } = useFormSubmit({
    successMessage: 'Perfil salvo com sucesso',
  });

  const initials = (initialName || email)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Use JPEG, PNG ou WebP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAvatarError('Máximo 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/settings/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setAvatarError(data.error || 'Erro ao enviar foto.');
        return;
      }

      const data = await res.json();
      setAvatar(data.avatar_url);
    } catch {
      setAvatarError('Erro ao enviar foto.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const res = await fetch('/api/settings/avatar', { method: 'DELETE' });
      if (res.ok) {
        setAvatar(null);
      }
    } catch {
      setAvatarError('Erro ao remover foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = () =>
    submit(() =>
      fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      }),
    );

  return (
    <div className="space-y-5">
      {/* Avatar section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar size="lg" className="h-16 w-16">
            {avatar && <AvatarImage src={avatar} alt="Foto de perfil" />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              {avatar ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            {avatar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAvatarRemove}
                disabled={uploadingAvatar}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">JPEG, PNG ou WebP. Max 2MB.</p>
          {avatarError && <p className="text-[11px] text-red-500">{avatarError}</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>

      {/* Name */}
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

      {/* Email */}
      <div>
        <label htmlFor="profile-email" className="text-sm font-medium">Email</label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          disabled
          className="mt-1 cursor-not-allowed opacity-60"
        />
        <p className="mt-1 text-xs text-muted-foreground">O email não pode ser alterado.</p>
      </div>

      {/* Save */}
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
