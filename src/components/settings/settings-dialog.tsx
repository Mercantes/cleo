'use client';

import { useState } from 'react';
import { Settings, User, Info, type LucideIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppearanceSettings } from './appearance-settings';
import { ProfileForm } from './profile-form';
import { ChangePassword } from './change-password';
import { DangerZone } from './danger-zone';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

type Section = 'geral' | 'conta' | 'sobre';

interface SectionDef {
  key: Section;
  label: string;
  icon: LucideIcon;
}

const sections: SectionDef[] = [
  { key: 'geral', label: 'Geral', icon: Settings },
  { key: 'conta', label: 'Conta', icon: User },
  { key: 'sobre', label: 'Sobre', icon: Info },
];

interface ProfileData {
  full_name: string | null;
  email: string;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function GeneralSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-5">
        <AppearanceSettings />
      </div>
    </div>
  );
}

function AccountSection({ profile, loading }: { profile: ProfileData | null; loading: boolean }) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="space-y-6">
      {profile && (
        <div className="rounded-lg border p-5">
          <ProfileForm initialName={profile.full_name || ''} email={profile.email} />
        </div>
      )}
      <div className="rounded-lg border p-5">
        <ChangePassword />
      </div>
      <DangerZone />
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-5">
        <h3 className="text-sm font-medium">Cleo</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua assistente financeira com inteligência artificial.
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Versão</dt>
            <dd className="font-medium">1.0.0</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plataforma</dt>
            <dd className="font-medium">Web</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-lg border p-5">
        <h3 className="text-sm font-medium">Legal</h3>
        <div className="mt-3 space-y-2">
          <a href="/terms" target="_blank" className="block text-sm text-primary hover:underline">
            Termos de Uso
          </a>
          <a href="/privacy" target="_blank" className="block text-sm text-primary hover:underline">
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<Section>('geral');
  const { data: profileData, isLoading } = useApi<{ profile: ProfileData }>(
    open ? '/api/settings/profile' : null,
  );
  const profile = profileData?.profile ?? null;

  const sectionTitle = sections.find((s) => s.key === activeSection)?.label || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl p-0 gap-0 overflow-hidden max-h-[85vh]">
        <div className="flex min-h-[500px]">
          {/* Sidebar */}
          <div className="w-48 shrink-0 border-r bg-muted/30 p-4">
            <DialogTitle className="mb-4 text-lg font-bold">Configurações</DialogTitle>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeSection === section.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="mb-5 text-lg font-bold">{sectionTitle}</h2>
            {activeSection === 'geral' && <GeneralSection />}
            {activeSection === 'conta' && <AccountSection profile={profile} loading={isLoading} />}
            {activeSection === 'sobre' && <AboutSection />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
