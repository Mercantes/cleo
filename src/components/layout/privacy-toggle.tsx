'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHideValues } from '@/hooks/use-hide-values';

export function PrivacyToggle() {
  const [hidden, toggle] = useHideValues();

  return (
    <Button variant="ghost" size="icon" className="cursor-pointer" onClick={toggle} aria-label={hidden ? 'Mostrar valores' : 'Esconder valores'}>
      {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}
