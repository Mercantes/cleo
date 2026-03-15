import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OnboardingGroupLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <Image src="/logo.png" alt="Cleo" width={56} height={56} className="mb-8 rounded-xl" />
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
