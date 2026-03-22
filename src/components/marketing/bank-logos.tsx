import Image from 'next/image';

type Bank = {
  name: string;
  logo: string;
  width: number;
  height: number;
};

const BANKS: Bank[] = [
  { name: 'Itau', logo: '/logos/itau.svg', width: 80, height: 80 },
  { name: 'Nubank', logo: '/logos/nubank.svg', width: 144, height: 80 },
  { name: 'Bradesco', logo: '/logos/bradesco.svg', width: 140, height: 28 },
  { name: 'XP Investimentos', logo: '/logos/xp.svg', width: 80, height: 75 },
  { name: 'Banco do Brasil', logo: '/logos/bb.svg', width: 140, height: 26 },
  { name: 'Safra', logo: '/logos/safra.svg', width: 343, height: 104 },
  { name: 'BTG Pactual', logo: '/logos/btg.svg', width: 800, height: 336 },
  { name: 'C6 Bank', logo: '/logos/c6bank.svg', width: 140, height: 28 },
  { name: 'Santander', logo: '/logos/santander.svg', width: 140, height: 26 },
  { name: 'Inter', logo: '/logos/inter.svg', width: 120, height: 30 },
];

export function BankLogos() {
  // Double the logos for seamless infinite scroll
  const logos = [...BANKS, ...BANKS];

  return (
    <section className="border-y bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Integrado com os principais bancos
        </p>
        <div className="relative overflow-hidden">
          {/* Fade edges — hidden on mobile to avoid covering logos */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-24 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent md:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-24 bg-gradient-to-l from-muted/30 via-muted/20 to-transparent md:block" />

          {/* Scrolling logos — doubled for seamless loop */}
          <div
            className="flex animate-scroll items-center"
            style={{ width: 'max-content' }}
          >
            {logos.map((bank, i) => (
              <div
                key={i}
                className="flex h-8 shrink-0 items-center justify-center px-4 md:h-10 md:px-10"
              >
                <Image
                  src={bank.logo}
                  alt={bank.name}
                  width={bank.width}
                  height={bank.height}
                  unoptimized
                  className="max-h-6 w-auto max-w-[80px] object-contain opacity-70 dark:brightness-0 dark:invert md:max-h-8 md:max-w-[120px] md:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
