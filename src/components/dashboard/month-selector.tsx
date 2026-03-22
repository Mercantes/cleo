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
    <div className="flex items-center gap-1 sm:gap-2" onKeyDown={handleKeyDown}>
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Mês anterior" className="h-10 w-10 sm:h-9 sm:w-9">
        <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
      <span
        className="min-w-[110px] text-center text-sm font-medium sm:min-w-[140px]"
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
        className="h-10 w-10 sm:h-9 sm:w-9"
      >
        <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(currentMonth)}
          className="ml-1 h-8 px-2.5 text-xs sm:h-7 sm:px-2 sm:text-[10px]"
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
