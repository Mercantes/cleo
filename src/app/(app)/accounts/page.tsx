'use client';

import { AccountsContent } from '@/components/accounts/accounts-content';

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas contas bancárias e cartões conectados.
        </p>
      </div>
      <AccountsContent />
    </div>
  );
}
