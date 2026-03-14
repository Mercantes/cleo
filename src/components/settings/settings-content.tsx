'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProfileForm } from './profile-form';
import { BankList } from './bank-list';
import { NotificationPreferences } from './notification-preferences';
import { TierStatus } from '@/components/layout/tier-status';
import { GoalsEditor } from './goals-editor';
import { DangerZone } from './danger-zone';
import { ChangePassword } from './change-password';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/components/ui/toast';

type Tab = 'profile' | 'banks' | 'goals' | 'notifications' | 'plan' | 'account';

interface ProfileData {
  full_name: string | null;
  email: string;
}

interface BankConnection {
  id: string;
  connector_name: string;
  connector_logo_url: string | null;
  status: string;
  last_sync_at: string | null;
}

const VALID_TABS: Tab[] = ['profile', 'banks', 'goals', 'notifications', 'plan', 'account'];

function getInitialTab(searchParams: URLSearchParams): Tab {
  const param = searchParams.get('tab');
  if (param && VALID_TABS.includes(param as Tab)) return param as Tab;
  return 'profile';
}

export function SettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => getInitialTab(searchParams));
  const { data: profileData, isLoading: profileLoading } = useApi<{ profile: ProfileData }>('/api/settings/profile');
  const { data: banksData, isLoading: banksLoading, mutate: mutateBanks } = useApi<{ connections: BankConnection[] }>('/api/settings/banks');

  const profile = profileData?.profile ?? null;
  const banks = banksData?.connections ?? [];
  const loading = profileLoading || banksLoading;

  // Sync tab when URL search params change (e.g. navigating from another page)
  useEffect(() => {
    const tabFromUrl = getInitialTab(searchParams);
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  const refreshBanks = () => { mutateBanks(); };

  const handleDisconnect = async (id: string) => {
    const previous = banksData;
    mutateBanks({ connections: banks.filter((b) => b.id !== id) }, false);
    try {
      const res = await fetch(`/api/settings/banks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Banco desconectado com sucesso');
    } catch {
      mutateBanks(previous);
      toast.error('Erro ao desconectar banco. Tente novamente.');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Perfil' },
    { key: 'banks', label: 'Bancos' },
    { key: 'goals', label: 'Metas' },
    { key: 'notifications', label: 'Notificações' },
    { key: 'plan', label: 'Plano' },
    { key: 'account', label: 'Conta' },
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
        <div className="space-y-8">
          <ProfileForm initialName={profile.full_name || ''} email={profile.email} />
          <div className="border-t pt-6">
            <ChangePassword />
          </div>
        </div>
      )}
      {activeTab === 'banks' && (
        <BankList connections={banks} onDisconnect={handleDisconnect} onRefresh={refreshBanks} />
      )}
      {activeTab === 'goals' && <GoalsEditor />}
      {activeTab === 'notifications' && <NotificationPreferences />}
      {activeTab === 'plan' && <TierStatus />}
      {activeTab === 'account' && <DangerZone />}
    </div>
  );
}
