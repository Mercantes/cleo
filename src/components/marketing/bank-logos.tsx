import Image from 'next/image';

const BANKS = [
  { name: 'Itaú', logo: '/logos/itau.svg' },
  { name: 'Nubank', logo: '/logos/nubank.svg' },
  { name: 'Bradesco', logo: '/logos/bradesco.svg' },
  { name: 'XP', logo: '/logos/xp.svg' },
  { name: 'Banco do Brasil', logo: '/logos/bb.svg' },
  { name: 'Safra', logo: '/logos/safra.svg' },
  { name: 'BTG Pactual', logo: '/logos/btg.svg' },
  { name: 'C6 Bank', logo: '/logos/c6bank.svg' },
  { name: 'Santander', logo: '/logos/santander.svg' },
  { name: 'Inter', logo: '/logos/inter.svg' },
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

          {/* Scrolling logos with names */}
          <div className="flex animate-scroll items-center gap-14">
            {[...BANKS, ...BANKS].map((bank, i) => (
              <div
                key={i}
                className="flex shrink-0 flex-col items-center gap-2 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
              >
                <Image
                  src={bank.logo}
                  alt={bank.name}
                  width={48}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
                <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                  {bank.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
