import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Redefinir Senha',
  robots: { index: false, follow: false },
};

export default function ResetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="mb-8 flex flex-col items-center gap-2">
        <Image src="/logo.png" alt="Cleo" width={56} height={56} className="rounded-xl" />
        <span className="text-2xl font-bold">Cleo</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
