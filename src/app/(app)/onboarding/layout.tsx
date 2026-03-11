import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Primeiros Passos',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
