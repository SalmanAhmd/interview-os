import { CalendarDays, CheckCircle2, ChevronRight, Pencil, RotateCcw } from 'lucide-react';
import type { RoadmapWeek } from '../../types';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { cn } from '../../lib/utils';
import { formatDate } from '../../lib/dates';

export function WeekCard({
  week,
  current,
  onOpen,
  onEdit,
  onComplete,
  onReopen,
}: {
  week: RoadmapWeek;
  current: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onReopen: () => void;
}) {
  const completedTasks = week.tasks.filter((task) => task.done).length;

  return (
    <Card
      id={`roadmap-week-${week.number}`}
      className={cn(
        'flex flex-col transition-colors hover:border-border/70',
        current && 'border-accent/40 bg-accent/[0.025]',
        week.status === 'Completed' && 'bg-muted/15',
      )}
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums',
                current
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-border bg-muted/40 text-muted-foreground',
              )}
            >
              {String(week.number).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {formatDate(week.startDate, 'd MMM')} – {formatDate(week.endDate, 'd MMM')}
              </p>
              <h3 className="truncate text-sm font-semibold tracking-tight">{week.title}</h3>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={week.status} />
            {current ? <Badge tone="info">Current</Badge> : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {week.technicalFocus.slice(0, 2).map((focus) => (
            <Badge key={focus} tone="outline" className="max-w-full truncate">
              {focus}
            </Badge>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-2xs text-muted-foreground">
            <span>{week.progress}% complete</span>
            <span>
              {completedTasks}/{week.tasks.length} tasks
            </span>
          </div>
          <Progress value={week.progress} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
          <span>{week.topics.length} topics</span>
          <span aria-hidden="true">·</span>
          <span>{week.exercises.length} exercises</span>
          <span aria-hidden="true">·</span>
          <span>{week.applicationTarget} applications</span>
        </div>

        <div className="mt-auto flex items-center gap-1 pt-4">
          <Button variant="secondary" size="sm" onClick={onOpen} className="flex-1">
            View week
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit Week ${week.number} plan`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {week.status === 'Completed' ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onReopen}
              aria-label={`Reopen Week ${week.number}`}
              title="Reopen week"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onComplete}
              aria-label={`Mark Week ${week.number} complete`}
              title="Mark week completed"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-2xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          Week {week.number} of 22
        </span>
        <span>{formatDate(week.endDate, 'yyyy')}</span>
      </div>
    </Card>
  );
}
