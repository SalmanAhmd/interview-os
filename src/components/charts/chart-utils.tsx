import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardHeader } from '../ui/card';
import { cn } from '../../lib/utils';

export const chartColors = {
  accent: '#3b82f6',
  accentSoft: 'rgba(59, 130, 246, 0.16)',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#a1a1aa',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
  card: 'hsl(var(--card))',
  foreground: 'hsl(var(--foreground))',
};

export const axisProps = {
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};

interface TooltipEntry {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  dataKey?: string | number;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: (value: number | string | Array<number | string>, name?: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-popover">
      {label !== undefined ? (
        <p className="mb-1 font-medium text-foreground">{label}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`${entry.dataKey}-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color ?? chartColors.accent }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">
              {formatter
                ? formatter(entry.value ?? '', entry.name)
                : String(entry.value ?? '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartFrame({
  title,
  description,
  action,
  children,
  height = 250,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  height?: number;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader title={title} description={description} action={action} />
      <div className="px-2 pb-3 pt-4" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="max-w-xs text-xs leading-5 text-muted-foreground">{message}</p>
    </div>
  );
}
