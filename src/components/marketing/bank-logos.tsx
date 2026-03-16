import Image from 'next/image';

function C6Logo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="35" viewBox="0 0 64 40" className={className} aria-label="C6 Bank">
      <path d="M16.5 40C11.1 40 7 38.2 4.2 34.6 1.4 31 0 26.2 0 20s1.4-11 4.2-14.6C7 1.8 11.1 0 16.5 0c4.2 0 7.7 1.2 10.5 3.6S31.5 9 31.8 13h-7.5c-.4-2-1.2-3.5-2.6-4.7-1.3-1.2-3-1.8-4.9-1.8-2.8 0-5 1.1-6.5 3.4C8.8 12.2 8 15.6 8 20s.8 7.8 2.3 10.1c1.5 2.3 3.7 3.4 6.5 3.4 1.9 0 3.6-.6 4.9-1.8 1.4-1.2 2.2-2.7 2.6-4.7h7.5c-.3 4-1.8 7.2-4.8 9.4C24.2 38.8 20.7 40 16.5 40z" fill="currentColor"/>
      <path d="M51.5 40c-4.2 0-7.5-1.4-9.9-4.1-2.4-2.8-3.6-6.4-3.6-10.9 0-3.5.7-6.7 2.1-9.5 1.4-2.8 3.3-5.4 5.7-7.7L50.4 3l3.8-3h8.5l-8 7.5-4.2 4.5c1.2-.5 2.6-.7 4-.7 3.6 0 6.5 1.2 8.7 3.7 2.2 2.4 3.3 5.6 3.3 9.5 0 4.5-1.4 8.1-4.1 10.8C59.7 38.6 56 40 51.5 40zm0-7c1.9 0 3.4-.7 4.5-2 1.1-1.4 1.7-3.2 1.7-5.5s-.6-4.1-1.7-5.5c-1.1-1.3-2.6-2-4.5-2s-3.4.7-4.5 2c-1.1 1.4-1.7 3.2-1.7 5.5s.6 4.1 1.7 5.5c1.1 1.3 2.6 2 4.5 2z" fill="currentColor"/>
    </svg>
  );
}

function XPLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100" className={className} aria-label="XP Investimentos">
      <rect width="100" height="100" rx="16" ry="16" fill="#1e1e1e" className="dark:fill-white"/>
      <path d="M24 22h12l14 18 14-18h12L60 54l18 24H66L50 58 34 78H22l18-24z" fill="#fff" className="dark:fill-[#1e1e1e]"/>
      <path d="M70 22h18c10 0 17 7 17 17s-7 17-17 17H80v22h-10V22zm10 25h7c5 0 8-3 8-8s-3-8-8-8h-7v16z" fill="#fff" className="dark:fill-[#1e1e1e]"/>
    </svg>
  );
}

type Bank = {
  name: string;
  logo: string;
  width: number;
  height: number;
  darkInvert?: boolean;
  inline?: 'c6' | 'xp';
};

const BANKS: Bank[] = [
  { name: 'Itaú', logo: '/logos/itau.svg', width: 40, height: 40 },
  { name: 'Nubank', logo: '/logos/nubank.svg', width: 72, height: 40 },
  { name: 'Bradesco', logo: '/logos/bradesco.svg', width: 100, height: 20 },
  { name: 'XP Investimentos', logo: '', width: 40, height: 40, inline: 'xp' },
  { name: 'Banco do Brasil', logo: '/logos/bb.svg', width: 100, height: 18 },
  { name: 'Safra', logo: '/logos/safra.svg', width: 60, height: 40, darkInvert: true },
  { name: 'BTG Pactual', logo: '/logos/btg.svg', width: 90, height: 36, darkInvert: true },
  { name: 'C6 Bank', logo: '', width: 56, height: 35, inline: 'c6' },
  { name: 'Santander', logo: '/logos/santander.svg', width: 100, height: 18 },
  { name: 'Inter', logo: '/logos/inter.svg', width: 80, height: 20 },
];

export function BankLogos() {
  return (
    <section className="border-y bg-muted/30 py-8">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="mb-6 text-center text-xs text-muted-foreground">
          Integrado com os principais bancos
        </p>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-muted/30 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-muted/30 to-transparent" />

          {/* Scrolling logos - w-max ensures translateX(-50%) = exactly one copy */}
          <div className="flex w-max animate-scroll items-center gap-14">
            {[...BANKS, ...BANKS].map((bank, i) => (
              <div
                key={i}
                className="flex h-12 shrink-0 items-center"
              >
                {bank.inline === 'c6' ? (
                  <C6Logo className="max-h-10 w-auto text-foreground" />
                ) : bank.inline === 'xp' ? (
                  <XPLogo className="max-h-10 w-auto" />
                ) : (
                  <Image
                    src={bank.logo}
                    alt={bank.name}
                    width={bank.width}
                    height={bank.height}
                    unoptimized
                    className={`max-h-10 w-auto object-contain${
                      bank.darkInvert
                        ? ' dark:brightness-0 dark:invert'
                        : ''
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
