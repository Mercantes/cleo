function ItauIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#EC7000" />
      <text x="20" y="28" textAnchor="middle" fontFamily="serif" fontWeight="700" fontSize="22" fontStyle="italic" fill="white">i</text>
    </svg>
  );
}

function NubankIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#820AD1" />
      <text x="20" y="28" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="20" fill="white">Nu</text>
    </svg>
  );
}

function BradescoIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#CC092F" />
      <path d="M14 30 L20 10 L26 30 Z" fill="white" opacity="0.9" />
      <path d="M11 30 L20 14 L29 30 Z" fill="white" opacity="0.5" />
    </svg>
  );
}

function XPIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#1E1E1E" />
      <text x="20" y="28" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="20" fill="#FFD100">XP</text>
    </svg>
  );
}

function OpenFinanceIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#1a6b4a" />
      <text x="20" y="27" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="16" fill="white">OF</text>
    </svg>
  );
}

function SafraIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#1B3A6B" />
      <text x="20" y="28" textAnchor="middle" fontFamily="serif" fontWeight="700" fontSize="22" fill="white">$</text>
    </svg>
  );
}

function BTGIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#1a1a2e" />
      <text x="20" y="27" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="14" fill="white">BTG</text>
    </svg>
  );
}

function C6Icon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#242424" />
      <text x="20" y="28" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="18" fill="white">C6</text>
    </svg>
  );
}

function SantanderIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#EC0000" />
      <path d="M20 8 L24 20 L20 16 L16 20 Z" fill="white" />
      <path d="M12 22 L16 14 L20 22 Z" fill="white" opacity="0.7" />
      <path d="M20 22 L24 14 L28 22 Z" fill="white" opacity="0.7" />
    </svg>
  );
}

function InterIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#FF7A00" />
      <text x="20" y="28" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="24" fill="white">i</text>
    </svg>
  );
}

const BANKS = [
  { name: 'Itaú', Icon: ItauIcon },
  { name: 'Nubank', Icon: NubankIcon },
  { name: 'Bradesco', Icon: BradescoIcon },
  { name: 'XP', Icon: XPIcon },
  { name: 'Open Finance', Icon: OpenFinanceIcon },
  { name: 'Safra', Icon: SafraIcon },
  { name: 'BTG Pactual', Icon: BTGIcon },
  { name: 'C6 Bank', Icon: C6Icon },
  { name: 'Santander', Icon: SantanderIcon },
  { name: 'Inter', Icon: InterIcon },
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
                <bank.Icon />
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
