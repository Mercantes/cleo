import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';

// Lazy-load all client components to isolate crashes
const AppSidebar = dynamic(() => import('@/components/layout/app-sidebar').then(m => m.AppSidebar), { ssr: false });
const Header = dynamic(() => import('@/components/layout/header').then(m => m.Header), { ssr: false });
const BottomNav = dynamic(() => import('@/components/layout/bottom-nav').then(m => m.BottomNav), { ssr: false });
const KeyboardShortcuts = dynamic(() => import('@/components/layout/keyboard-shortcuts').then(m => m.KeyboardShortcuts), { ssr: false });
const PwaInstallPrompt = dynamic(() => import('@/components/layout/pwa-install-prompt').then(m => m.PwaInstallPrompt), { ssr: false });
const QuickChatFab = dynamic(() => import('@/components/chat/quick-chat-fab').then(m => m.QuickChatFab), { ssr: false });
const RoutePrefetch = dynamic(() => import('@/components/layout/route-prefetch').then(m => m.RoutePrefetch), { ssr: false });
const RealtimeListener = dynamic(() => import('@/components/layout/realtime-listener').then(m => m.RealtimeListener), { ssr: false });
const OfflineBanner = dynamic(() => import('@/components/ui/offline-banner').then(m => m.OfflineBanner), { ssr: false });

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
    .select('full_name, onboarding_completed')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null; onboarding_completed: boolean | null } | null };

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
      <div className="flex flex-1 flex-col">
        <Header userName={displayName} />
        <main id="main-content" className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
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
