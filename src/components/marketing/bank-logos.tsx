import Image from 'next/image';

function C6Logo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 52" className={className} aria-label="C6 Bank">
      <rect width="84" height="52" rx="10" ry="10" fill="#121212" className="dark:fill-white" />
      <text x="42" y="38" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="bold" fontSize="34" letterSpacing="-1" fill="#fff" className="dark:fill-[#121212]">C6</text>
    </svg>
  );
}

function XPLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className} aria-label="XP Investimentos">
      <rect width="100" height="100" rx="18" ry="18" fill="#1e1e1e" className="dark:fill-white"/>
      <text x="50" y="68" textAnchor="middle" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="bold" fontSize="52" letterSpacing="-2" fill="#fff" className="dark:fill-[#1e1e1e]">XP</text>
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
                  <C6Logo className="h-8 w-auto" />
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
