'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface MonthSelectorProps {
  month: string; // YYYY-MM
  onChange: (month: string) => void;
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  const [year, m] = month.split('-').map(Number);
  const label = `${MONTH_NAMES[m - 1]} ${year}`;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = month === currentMonth;

  function navigate(delta: number) {
    const d = new Date(year, m - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onChange(newMonth);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigate(-1);
    } else if (e.key === 'ArrowRight' && !isCurrentMonth) {
      e.preventDefault();
      navigate(1);
    }
  }

  return (
    <div className="flex items-center gap-2" onKeyDown={handleKeyDown}>
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className="min-w-[140px] text-center text-sm font-medium"
        tabIndex={0}
        role="status"
        aria-live="polite"
      >
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(currentMonth)}
          className="ml-1 h-7 px-2 text-[10px]"
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
