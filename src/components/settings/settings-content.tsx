'use client';

import { useEffect, useState } from 'react';
import { ProfileForm } from './profile-form';
import { BankList } from './bank-list';
import { NotificationPreferences } from './notification-preferences';
import { TierStatus } from '@/components/layout/tier-status';

type Tab = 'profile' | 'banks' | 'notifications' | 'plan';

interface ProfileData {
  full_name: string | null;
  email: string;
}

interface BankConnection {
  id: string;
  connector_name: string;
  status: string;
  last_sync_at: string | null;
}

export function SettingsContent() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [banks, setBanks] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/profile').then((r) => r.json()),
      fetch('/api/settings/banks').then((r) => r.json()),
    ])
      .then(([profileRes, banksRes]) => {
        setProfile(profileRes.profile);
        setBanks(banksRes.connections || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDisconnect = async (id: string) => {
    setBanks((prev) => prev.filter((b) => b.id !== id));
    await fetch(`/api/settings/banks?id=${id}`, { method: 'DELETE' });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Perfil' },
    { key: 'banks', label: 'Bancos' },
    { key: 'notifications', label: 'Notificações' },
    { key: 'plan', label: 'Plano' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div>
      <div role="tablist" className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && profile && (
        <ProfileForm initialName={profile.full_name || ''} email={profile.email} />
      )}
      {activeTab === 'banks' && (
        <BankList connections={banks} onDisconnect={handleDisconnect} />
      )}
      {activeTab === 'notifications' && <NotificationPreferences />}
      {activeTab === 'plan' && <TierStatus />}
    </div>
  );
}
