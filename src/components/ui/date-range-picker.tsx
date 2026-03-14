'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({ value, onChange, className, placeholder = 'Selecionar período' }: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 justify-start text-left font-normal',
            !value?.from && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'dd/MM/yyyy', { locale: ptBR })}
                {' — '}
                {format(value.to, 'dd/MM/yyyy', { locale: ptBR })}
              </>
            ) : (
              format(value.from, 'dd/MM/yyyy', { locale: ptBR })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
