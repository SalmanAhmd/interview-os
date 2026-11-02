import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
  compact,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
  compact?: boolean;
}) {
  return (
    <Card className={cn('group transition-colors hover:border-border/80', className)}>
      <div className={cn('flex items-start justify-between gap-3', compact ? 'p-4' : 'p-5')}>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="mt-1.5 text-2xs leading-4 text-muted-foreground">{hint}</p> : null}
          {trend ? (
            <p
              className={cn(
                'mt-1.5 text-2xs font-medium',
                trend.positive === false ? 'text-danger' : 'text-success',
              )}
            >
              {trend.value}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
