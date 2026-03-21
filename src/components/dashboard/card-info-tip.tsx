'use client';

import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CardInfoTipProps {
  text: string;
}

export function CardInfoTip({ text }: CardInfoTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger className="rounded-full p-0.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[240px]">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
