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
  { name: 'BTG Pactual', logo: '/logos/btg.svg', width: 800, height: 336 },
  { name: 'C6 Bank', logo: '/logos/c6bank.svg', width: 140, height: 28 },
  { name: 'Santander', logo: '/logos/santander.svg', width: 140, height: 26 },
  { name: 'Inter', logo: '/logos/inter.svg', width: 120, height: 30 },
];

export function BankLogos() {
  return (
    <section className="border-y bg-muted/30 py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground md:mb-8">
          Integrado com os principais bancos
        </p>

        {/* Mobile: static grid — no animation, no iOS Safari issues */}
        <div className="grid grid-cols-5 items-center gap-x-4 gap-y-6 md:hidden">
          {BANKS.map((bank) => (
            <div key={bank.name} className="flex items-center justify-center">
              <Image
                src={bank.logo}
                alt={bank.name}
                width={bank.width}
                height={bank.height}
                unoptimized
                className="max-h-6 w-auto object-contain"
              />
            </div>
          ))}
        </div>

        {/* Desktop: animated marquee (3x duplication for seamless loop) */}
        <div className="relative hidden overflow-hidden md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted/30 via-muted/20 to-transparent" />

          <div className="flex w-max animate-scroll items-center gap-20">
            {[...BANKS, ...BANKS, ...BANKS].map((bank, i) => (
              <Image
                key={i}
                src={bank.logo}
                alt={bank.name}
                width={bank.width}
                height={bank.height}
                unoptimized
                className="max-h-8 w-auto shrink-0 object-contain"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
