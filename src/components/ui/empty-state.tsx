import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 text-center sm:py-14 md:py-20">
      <div className="relative">
        <div className="absolute -inset-3 rounded-full bg-primary/5" />
        <div className="relative rounded-full bg-muted p-5">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action.onClick} disabled={action.disabled}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
