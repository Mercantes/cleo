import Image from 'next/image';

const BANKS = [
  { name: 'Itaú', logo: '/logos/itau.svg', width: 40, height: 40 },
  { name: 'Nubank', logo: '/logos/nubank.svg', width: 72, height: 40 },
  { name: 'Bradesco', logo: '/logos/bradesco.svg', width: 100, height: 20 },
  { name: 'XP', logo: '/logos/xp.svg', width: 80, height: 20, darkInvert: true },
  { name: 'Banco do Brasil', logo: '/logos/bb.svg', width: 100, height: 18, darkInvert: true },
  { name: 'Safra', logo: '/logos/safra.svg', width: 60, height: 40 },
  { name: 'BTG Pactual', logo: '/logos/btg.svg', width: 90, height: 36, darkInvert: true },
  { name: 'C6 Bank', logo: '/logos/c6bank.svg', width: 90, height: 18, darkInvert: true },
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
                className="flex h-16 shrink-0 flex-col items-center justify-center gap-2"
              >
                <div className="flex h-10 items-center">
                  <Image
                    src={bank.logo}
                    alt={bank.name}
                    width={bank.width}
                    height={bank.height}
                    className={`max-h-10 w-auto object-contain${
                      'darkInvert' in bank && bank.darkInvert
                        ? ' dark:brightness-0 dark:invert'
                        : ''
                    }`}
                  />
                </div>
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
