export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
