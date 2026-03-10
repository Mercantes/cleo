import { createClient } from '@/lib/supabase/server';
import { Landmark } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single();

  const displayName = profile?.full_name || user!.email?.split('@')[0] || 'usuário';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-2xl font-bold">Olá, {displayName}!</h1>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <Landmark className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Conecte seu banco para começar</h2>
        <p className="max-w-md text-muted-foreground">
          Vincule suas contas bancárias para ver suas transações, receber insights da IA e projetar
          seu futuro financeiro.
        </p>
      </div>
    </div>
  );
}
