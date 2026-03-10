import { BankConnectionList } from '@/components/bank/bank-connection-list';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas conexões bancárias e preferências.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Bancos conectados</h2>
        <BankConnectionList />
      </section>
    </div>
  );
}
