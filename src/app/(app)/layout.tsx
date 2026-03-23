import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Toaster } from '@/components/ui/toast';
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts';
import { PwaInstallPrompt } from '@/components/layout/pwa-install-prompt';
import { QuickChatFab } from '@/components/chat/quick-chat-fab';
import { RoutePrefetch } from '@/components/layout/route-prefetch';
import { RealtimeListener } from '@/components/layout/realtime-listener';
import { OfflineBanner } from '@/components/ui/offline-banner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, onboarding_completed, avatar_url')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null; onboarding_completed: boolean | null; avatar_url: string | null } | null };

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'usuário';

  return (
    <div className="flex h-screen flex-col bg-background">
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Ir para o conteúdo principal
      </a>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header userName={displayName} avatarUrl={profile?.avatar_url} />
        <main id="main-content" className="flex-1 overflow-auto p-3 pb-20 sm:p-4 md:p-6 md:pb-6">
          <Suspense fallback={
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <Toaster />
      <KeyboardShortcuts />
      <PwaInstallPrompt />
      <QuickChatFab />
      <RoutePrefetch />
      <RealtimeListener />
      </div>
    </div>
  );
}
