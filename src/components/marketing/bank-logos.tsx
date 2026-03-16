import Image from 'next/image';

function C6Logo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="28" viewBox="0 0 180 70" className={className} aria-label="C6 Bank">
      {/* Rounded container */}
      <rect width="180" height="70" rx="12" ry="12" fill="#121212" className="dark:fill-white" />
      {/* C */}
      <path d="M28 56c-4.5 0-8-1.5-10.8-4.5C14.4 48.5 13 44.5 13 39.5s1.4-9 4.2-12c2.8-3 6.3-4.5 10.8-4.5 3.5 0 6.4 1 8.7 3 2.3 1.9 3.8 4.5 4.1 7.8h-6.2c-.3-1.7-1.1-3-2.2-4-1.1-1-2.6-1.5-4.2-1.5-2.4 0-4.2 1-5.5 2.9-1.3 1.9-1.9 4.6-1.9 8.3s.6 6.5 1.9 8.3c1.3 1.9 3.1 2.9 5.5 2.9 1.6 0 3.1-.5 4.2-1.5 1.1-1 1.9-2.3 2.2-4h6.2c-.3 3.3-1.8 5.9-4.1 7.8-2.3 2-5.2 3-8.7 3z" fill="#fff" className="dark:fill-[#121212]" />
      {/* 6 */}
      <path d="M58 56c-3.5 0-6.3-1.2-8.3-3.5-2-2.4-3-5.4-3-9.2 0-3 .6-5.6 1.8-8 1.2-2.4 2.8-4.5 4.8-6.5l4.2-4 3.2-2.5h7.1l-6.7 6.3-3.5 3.8c1-.4 2.2-.6 3.4-.6 3 0 5.4 1 7.3 3.1 1.8 2 2.8 4.7 2.8 8 0 3.8-1.2 6.8-3.4 9.1C63.4 54.8 61 56 58 56zm0-5.8c1.6 0 2.9-.6 3.8-1.7.9-1.2 1.4-2.7 1.4-4.6s-.5-3.4-1.4-4.6c-.9-1.1-2.2-1.7-3.8-1.7s-2.9.6-3.8 1.7c-.9 1.2-1.4 2.7-1.4 4.6s.5 3.4 1.4 4.6c.9 1.1 2.2 1.7 3.8 1.7z" fill="#fff" className="dark:fill-[#121212]" />
      {/* B -->}
      <path d="M82 55V24h7.2c2.7 0 4.8.7 6.3 2.1 1.4 1.4 2.2 3.2 2.2 5.4 0 1.7-.4 3.1-1.2 4.2-.8 1.2-1.9 2-3.3 2.4 1.6.3 2.9 1.2 3.8 2.4.9 1.3 1.4 2.9 1.4 4.7 0 2.5-.8 4.5-2.4 6.1-1.6 1.5-3.8 2.2-6.6 2.2H82zm6.3-19h1.8c1.1 0 1.9-.3 2.6-1 .7-.7 1-1.5 1-2.6 0-1.1-.3-1.9-1-2.6-.7-.7-1.5-1-2.6-1h-1.8v7.2zm0 13.2h2.5c1.3 0 2.3-.4 3-1.1.7-.7 1.1-1.7 1.1-3s-.4-2.3-1.1-3c-.7-.7-1.7-1.1-3-1.1h-2.5v8.2z" fill="#fff" className="dark:fill-[#121212]" />
      {/* a */}
      <path d="M110 55.5c-2.1 0-3.8-.6-5-1.9-1.2-1.3-1.8-3-1.8-5 0-2.2.7-3.9 2.1-5 1.4-1.2 3.3-1.9 5.6-2.1l3.4-.3c0-1.1-.3-2-.8-2.5-.6-.6-1.4-.9-2.5-.9-1 0-1.7.2-2.3.7-.6.4-1 1.1-1.2 1.9h-5.7c.2-2.4 1.1-4.2 2.9-5.6 1.7-1.3 3.9-2 6.5-2 2.8 0 5 .8 6.5 2.3 1.6 1.5 2.4 3.6 2.4 6.4v8c0 1.5.2 2.7.6 3.5v.4H115c-.3-.7-.4-1.4-.4-2.4-1.4 1.9-3.4 2.8-5.8 2.8zm1.7-4.5c1.3 0 2.4-.3 3.2-1.1.8-.7 1.3-1.6 1.3-2.7v-2.1l-2.5.3c-1.3.2-2.2.5-2.8 1-.6.5-.9 1.2-.9 2.1 0 .7.2 1.3.7 1.8.5.4 1.1.7 1.9.7z" fill="#fff" className="dark:fill-[#121212]" />
      {/* n */}
      <path d="M128 55V38h5.5v3.5c1.5-2.6 3.8-3.9 6.8-3.9 2.2 0 3.9.7 5.2 2.1 1.3 1.4 2 3.3 2 5.8V55h-5.8V46.5c0-1.7-.4-3-1.1-3.8-.8-.9-1.8-1.3-3.2-1.3-1.5 0-2.8.6-3.7 1.7-.9 1.1-1.4 2.6-1.4 4.4V55H128z" fill="#fff" className="dark:fill-[#121212]" />
      {/* k */}
      <path d="M154 55V22h5.8v18.5l7-2.5h2.5l-7.5 8L170 55h-3l-7-8-1.2 1.2V55H154z" fill="#fff" className="dark:fill-[#121212]" />
    </svg>
  );
}

function XPLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100" className={className} aria-label="XP Investimentos">
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
  { name: 'XP Investimentos', logo: '', width: 36, height: 36, inline: 'xp' },
  { name: 'Banco do Brasil', logo: '/logos/bb.svg', width: 100, height: 18 },
  { name: 'Safra', logo: '/logos/safra.svg', width: 60, height: 40, darkInvert: true },
  { name: 'BTG Pactual', logo: '/logos/btg.svg', width: 90, height: 36, darkInvert: true },
  { name: 'C6 Bank', logo: '', width: 72, height: 28, inline: 'c6' },
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
                  <C6Logo className="h-7 w-auto" />
                ) : bank.inline === 'xp' ? (
                  <XPLogo className="h-9 w-auto" />
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
