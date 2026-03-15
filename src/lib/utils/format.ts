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
