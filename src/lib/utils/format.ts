const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return currencyFormatter.format(0);
  return currencyFormatter.format(amount);
}

export function formatCompactCurrency(amount: number): string {
  return compactFormatter.format(amount);
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  // Date-only strings (YYYY-MM-DD) - show just the date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  // Full datetime - show date + time
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeDate(date: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(date + 'T00:00:00');
  d.setHours(0, 0, 0, 0);

  const diff = today.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';

  return formatDate(date);
}

/**
 * Clean and format transaction description for display.
 * Prefers merchant name over raw description when available.
 */
export function formatTransactionName(description: string, merchant?: string | null): string {
  const raw = merchant || description;

  let cleaned = raw
    // Remove acquirer/gateway prefixes
    .replace(
      /^(dm|ifd|pag|mp|pagseguro|mercpago|pic|int|ame|stone|cielo|rede|getnet|sumup|ton)\s*[*\-/]?\s*/i,
      '',
    )
    // Remove transaction type prefixes
    .replace(
      /^(Compra no débito|Compra no debito|Compra no crédito|Compra no credito|Pagamento recebido|Transferência Recebida|Transferencia Recebida|Transferência Enviada|Transferencia Enviada|Pagamento efetuado|Pagamento de boleto|Débito automático|Debito automatico)\s*[-|:.]?\s*/i,
      '',
    )
    // Remove asterisks used as separators
    .replace(/\*+/g, ' ')
    // Remove trailing location suffixes (BR, BRA, SAO PAULO, SP, etc.)
    .replace(/\s+(br|bra|brasil)\s*$/i, '')
    .replace(
      /\s+(sao paulo|s[aã]o paulo|sp|rj|mg|pr|rs|sc|ba|pe|ce|df|go|mt|ms|pa|am|ma|pi|pb|rn|se|al|es|to|ro|ac|ap|rr)\s*$/i,
      '',
    )
    // Remove date patterns (01/06, 03/2026)
    .replace(/\s+\d{2}\/\d{2}(\/\d{2,4})?\s*/g, ' ')
    // Remove trailing numbers that look like codes
    .replace(/\s+\d{6,}\s*$/, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) cleaned = raw.trim();

  // Title case: capitalize first letter of each word, lowercase the rest
  cleaned = cleaned
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
    // Keep common short words lowercase (except at start)
    .replace(/\s(De|Do|Da|Dos|Das|E|Em|No|Na|Nos|Nas|Para|Por|Com|Sem)\s/g, (m) => m.toLowerCase())
    // Fix first character always uppercase
    .replace(/^./, (c) => c.toUpperCase());

  return cleaned;
}

/**
 * Get current date parts in Brazil timezone (America/Sao_Paulo).
 * Use on server-side code to avoid UTC shift near midnight.
 */
export function getBrazilNow(): { year: number; month: number; day: number; dateStr: string } {
  const now = new Date();
  const brDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const [year, month, day] = brDate.split('-').map(Number);
  return { year, month, day, dateStr: brDate };
}

export function formatDateGroupLabel(date: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(date + 'T00:00:00');
  d.setHours(0, 0, 0, 0);

  const diff = today.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';

  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  if (days < 7) return weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
