import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-transparent bg-muted text-muted-foreground',
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/20 bg-danger/10 text-danger',
  info: 'border-accent/20 bg-accent/10 text-accent',
  outline: 'border-border bg-transparent text-muted-foreground',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-2xs font-medium leading-4',
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function toneForStatus(status: string): BadgeTone {
  const normalized = status.toLowerCase();
  if (
    ['completed', 'passed', 'offer', 'offer received', 'done', 'confident', 'mastered', 'strong'].includes(
      normalized,
    )
  ) {
    return 'success';
  }
  if (
    [
      'rejected',
      'failed',
      'withdrawn',
      'urgent',
      'high',
      'at risk',
      'no show',
      'needs revision',
    ].includes(normalized)
  ) {
    return 'danger';
  }
  if (
    [
      'on hold',
      'pending',
      'warning',
      'medium',
      'in progress',
      'learning',
      'practiced',
      'needs practice',
      'applied',
      'recruiter screen',
      'technical round',
      'machine coding round',
      'system design round',
      'hiring manager round',
      'hr / offer',
      'referral requested',
    ].includes(normalized)
  ) {
    return 'warning';
  }
  if (['not started', 'todo', 'to research', 'low', 'backup'].includes(normalized)) {
    return 'neutral';
  }
  return 'outline';
}

export function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  return (
    <Badge tone={toneForStatus(status)} dot={dot}>
      {status}
    </Badge>
  );
}
