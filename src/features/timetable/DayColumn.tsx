import {
  CheckCircle2,
  Circle,
  CircleSlash2,
  Clock3,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react';
import type { ActivityCategory, DailyLog, SlotStatus, TimetableSlot } from '../../types';
import type { DayStudyStats } from '../../lib/analytics/timetable';
import { Progress } from '../../components/ui/progress';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { cn, formatDuration } from '../../lib/utils';
import { formatDate, formatTime, todayISO } from '../../lib/dates';

const categoryDots: Record<ActivityCategory, string> = {
  'Technical Concepts': 'bg-blue-500',
  'Hands-on Coding': 'bg-violet-500',
  'Interview Communication': 'bg-amber-500',
  'System Design': 'bg-cyan-500',
  'Mock Interview': 'bg-emerald-500',
  'Review & Applications': 'bg-orange-500',
  'DSA / Machine Coding': 'bg-pink-500',
  'Weak-area Revision': 'bg-rose-500',
  Planning: 'bg-zinc-500',
  Custom: 'bg-slate-500',
};

export function DayColumn({
  date,
  stats,
  log,
  onAdd,
  onEdit,
  onDelete,
  onOpenNote,
}: {
  date: Date;
  stats: DayStudyStats;
  log?: DailyLog;
  onAdd: (day: number) => void;
  onEdit: (slot: TimetableSlot) => void;
  onDelete: (slot: TimetableSlot) => void;
  onOpenNote: (date: Date) => void;
}) {
  const setSlotStatus = useAppStore((state) => state.setSlotStatus);
  const { success } = useToast();
  const dateKey = formatDate(date, 'yyyy-MM-dd');
  const isToday = dateKey === todayISO();
  const statusFor = (slotId: string): SlotStatus | undefined => log?.statuses?.[slotId];
  const note = log?.notes?.trim();

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border border-border bg-card',
        isToday && 'border-accent/40',
      )}
    >
      <div className="border-b border-border px-2.5 py-2.5">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-2xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {formatDate(date, 'EEE')}
            </span>
            <span
              className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-2xs font-semibold tabular-nums',
                isToday ? 'bg-accent text-accent-foreground' : 'text-foreground',
              )}
            >
              {formatDate(date, 'd')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onAdd(date.getDay() === 0 ? 7 : date.getDay())}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Add activity on ${formatDate(date, 'EEEE')}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-2xs text-muted-foreground">
          <span>{formatDuration(stats.completedMinutes)} done</span>
          <span className="tabular-nums">{stats.completion}%</span>
        </div>
        <Progress value={stats.completion} className="mt-1.5 h-1" />
      </div>

      <div className="flex-1 space-y-1.5 p-1.5">
        {stats.slots.length ? (
          stats.slots.map((slot) => {
            const status = statusFor(slot.id);
            const done = status === 'done';
            const skipped = status === 'skipped';
            return (
              <div
                key={slot.id}
                className={cn(
                  'group rounded-md border border-border/80 bg-background/40 p-2 transition-colors hover:bg-muted/30',
                  done && 'opacity-65',
                  skipped && 'border-dashed',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSlotStatus(dateKey, slot.id, done ? null : 'done');
                      if (!done) success('Activity completed', { description: slot.title });
                    }}
                    className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-success"
                    aria-label={done ? `Mark ${slot.title} incomplete` : `Mark ${slot.title} complete`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : skipped ? (
                      <CircleSlash2 className="h-3.5 w-3.5 text-warning" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <p
                    className={cn(
                      'min-w-0 flex-1 truncate text-2xs font-medium leading-4',
                      (done || skipped) && 'line-through',
                    )}
                    title={slot.title}
                  >
                    {slot.title}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-1.5 pl-5 text-2xs text-muted-foreground">
                  <span
                    className={cn('h-1.5 w-1.5 shrink-0 rounded-full', categoryDots[slot.category])}
                    aria-hidden="true"
                  />
                  <span className="truncate">{slot.category}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-1 pl-5">
                  <span className="inline-flex items-center gap-1 text-2xs tabular-nums text-muted-foreground">
                    <Clock3 className="h-2.5 w-2.5" />
                    {formatTime(slot.startTime)} · {slot.durationMinutes}m
                  </span>
                  <div className="flex items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSlotStatus(dateKey, slot.id, skipped ? null : 'skipped');
                        success(skipped ? 'Activity restored' : 'Activity skipped', {
                          description: slot.title,
                        });
                      }}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-warning"
                      aria-label={skipped ? `Restore ${slot.title}` : `Skip ${slot.title}`}
                      title={skipped ? 'Restore' : 'Skip this date'}
                    >
                      <CircleSlash2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(slot)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Edit ${slot.title}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(slot)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger"
                      aria-label={`Delete ${slot.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <button
            type="button"
            onClick={() => onAdd(date.getDay() === 0 ? 7 : date.getDay())}
            className="flex w-full flex-col items-center justify-center rounded-md border border-dashed border-border py-5 text-2xs text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
          >
            <Plus className="mb-1 h-3.5 w-3.5" />
            Add activity
          </button>
        )}
      </div>

      <div className="border-t border-border p-1.5">
        <button
          type="button"
          onClick={() => onOpenNote(date)}
          className="flex w-full items-start gap-1.5 rounded-md px-1.5 py-1.5 text-left text-2xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <StickyNote className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span className={cn('line-clamp-2 leading-4', !note && 'italic opacity-70')}>
            {note || 'Daily note'}
          </span>
        </button>
      </div>
    </div>
  );
}
