/* Faithful SVG reproductions of Brazilian bank brand marks */

function ItauIcon() {
  // Itaú: blue rounded square, orange serif italic "itaú"
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#003DA5" />
      <text x="20" y="30" textAnchor="middle" fontFamily="'Georgia', serif" fontWeight="700" fontSize="24" fontStyle="italic" fill="#F58220">itaú</text>
    </svg>
  );
}

function NubankIcon() {
  // Nubank: purple background, stylized "Nu" mark
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#820AD1" />
      <path
        d="M12 28V17.5C12 14.5 14 12.5 17 12.5C20 12.5 21.5 14.5 21.5 17.5V28"
        stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
      <path
        d="M21.5 12.5V23C21.5 26 23.5 28 26.5 28"
        stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function BradescoIcon() {
  // Bradesco: red background, white "Tree of Life" (Árvore da Vida)
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#CC092F" />
      {/* Stylized tree of life */}
      <path d="M20 6 C20 6 28 14 28 20 C28 26 24 30 20 34 C16 30 12 26 12 20 C12 14 20 6 20 6Z" fill="white" opacity="0.9" />
      <path d="M20 10 C20 10 14 16 14 21 C14 25 17 28 20 31" stroke="#CC092F" strokeWidth="1.5" fill="none" />
      <path d="M20 10 C20 10 26 16 26 21 C26 25 23 28 20 31" stroke="#CC092F" strokeWidth="1.5" fill="none" />
      <line x1="20" y1="10" x2="20" y2="31" stroke="#CC092F" strokeWidth="1.2" />
    </svg>
  );
}

function XPIcon() {
  // XP: dark background, yellow X + white P
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#1E1E1E" />
      <text x="12" y="29" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="22" fill="#FFD100">X</text>
      <text x="25" y="29" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="22" fill="white">P</text>
    </svg>
  );
}

function OpenFinanceIcon() {
  // Open Finance Brasil: green background, connected nodes pattern
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#006B3F" />
      {/* Connected circles/nodes */}
      <circle cx="14" cy="14" r="3" fill="white" />
      <circle cx="26" cy="14" r="3" fill="white" />
      <circle cx="20" cy="26" r="3" fill="white" />
      <circle cx="10" cy="26" r="2.5" fill="white" opacity="0.7" />
      <circle cx="30" cy="26" r="2.5" fill="white" opacity="0.7" />
      <line x1="14" y1="14" x2="26" y2="14" stroke="white" strokeWidth="1.5" />
      <line x1="14" y1="14" x2="20" y2="26" stroke="white" strokeWidth="1.5" />
      <line x1="26" y1="14" x2="20" y2="26" stroke="white" strokeWidth="1.5" />
      <line x1="10" y1="26" x2="20" y2="26" stroke="white" strokeWidth="1.2" opacity="0.7" />
      <line x1="20" y1="26" x2="30" y2="26" stroke="white" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}

function SafraIcon() {
  // Safra: navy blue background, stylized "S" monogram
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#1B3A6B" />
      <path
        d="M24 13C24 13 22 11 19.5 11C17 11 15 12.5 15 14.5C15 16.5 16.5 17.5 19.5 18.5C22.5 19.5 25 20.5 25 23.5C25 26.5 22.5 29 19.5 29C16.5 29 14 27 14 27"
        stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function BTGIcon() {
  // BTG Pactual: dark navy background, white "BTG" text
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#0D1B2A" />
      <text x="20" y="26" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="13" letterSpacing="1" fill="white">BTG</text>
    </svg>
  );
}

function C6Icon() {
  // C6 Bank: carbon black background, white bold "C6"
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#242424" />
      <text x="20" y="28" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="white">C6</text>
    </svg>
  );
}

function SantanderIcon() {
  // Santander: red background, white flame symbol
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#EC0000" />
      {/* Santander flame - 3 flames */}
      <path d="M20 8 L23 18 L20 15 L17 18 Z" fill="white" />
      <path d="M13 18 L17 10 L20 18 L16.5 20 Z" fill="white" opacity="0.85" />
      <path d="M27 18 L23 10 L20 18 L23.5 20 Z" fill="white" opacity="0.85" />
      {/* Base arc */}
      <path d="M12 24 C12 20 16 18 20 20 C24 18 28 20 28 24 C28 28 24 32 20 32 C16 32 12 28 12 24Z" fill="white" />
    </svg>
  );
}

function InterIcon() {
  // Inter: orange circle with white lowercase "i"
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#FF7A00" />
      <circle cx="20" cy="12" r="2.5" fill="white" />
      <rect x="17.5" y="17" width="5" height="14" rx="2" fill="white" />
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
