import Image from 'next/image';

type Bank = {
  name: string;
  logo: string;
  width: number;
  height: number;
  darkInvert?: boolean;
};

const BANKS: Bank[] = [
  { name: 'Itaú', logo: '/logos/itau.svg', width: 80, height: 80 },
  { name: 'Nubank', logo: '/logos/nubank.svg', width: 144, height: 80 },
  { name: 'Bradesco', logo: '/logos/bradesco.svg', width: 140, height: 28 },
  { name: 'XP Investimentos', logo: '/logos/xp.svg', width: 80, height: 75, darkInvert: true },
  { name: 'Banco do Brasil', logo: '/logos/bb.svg', width: 140, height: 26 },
  { name: 'Safra', logo: '/logos/safra.svg', width: 343, height: 104, darkInvert: true },
  { name: 'BTG Pactual', logo: '/logos/btg.svg', width: 800, height: 336, darkInvert: true },
  { name: 'C6 Bank', logo: '/logos/c6bank.svg', width: 140, height: 28, darkInvert: true },
  { name: 'Santander', logo: '/logos/santander.svg', width: 140, height: 26 },
  { name: 'Inter', logo: '/logos/inter.svg', width: 120, height: 30 },
];

const LOGO_HEIGHT = 'max-h-7';

export function BankLogos() {
  return (
    <section className="border-y bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Integrado com os principais bancos
        </p>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted/30 via-muted/20 to-transparent" />

          {/* Scrolling logos — tripled for seamless loop */}
          <div className="flex w-max animate-scroll items-center gap-12 md:gap-20">
            {[...BANKS, ...BANKS, ...BANKS].map((bank, i) => (
              <div
                key={i}
                className="flex h-8 shrink-0 items-center"
              >
                <Image
                  src={bank.logo}
                  alt={bank.name}
                  width={bank.width}
                  height={bank.height}
                  unoptimized
                  className={`${LOGO_HEIGHT} w-auto object-contain${bank.darkInvert ? ' dark:brightness-0 dark:invert' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
