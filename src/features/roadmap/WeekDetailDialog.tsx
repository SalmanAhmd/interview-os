import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { RoadmapWeek, WeekStatus } from '../../types';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, ConfirmDialog } from '../../components/ui/dialog';
import { Input, Textarea } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';
import { formatDate, getWeekLabel } from '../../lib/dates';
import { LinkButton } from '../../components/common/LinkButton';

const WEEK_STATUSES: WeekStatus[] = [
  'Not Started',
  'In Progress',
  'Completed',
  'Needs Revision',
  'On Hold',
];

function DetailList({ title, items, tone }: { title: string; items: string[]; tone?: 'accent' | 'muted' }) {
  return (
    <section>
      <h3 className="mb-1.5 text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h3>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-5">
              <span
                className={cn(
                  'mt-[7px] h-1 w-1 shrink-0 rounded-full',
                  tone === 'accent' ? 'bg-accent' : 'bg-muted-foreground/60',
                )}
              />
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No items added.</p>
      )}
    </section>
  );
}

export function WeekDetailDialog({
  week,
  open,
  onClose,
  onEdit,
  onNavigate,
}: {
  week: RoadmapWeek | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onNavigate: (week: RoadmapWeek) => void;
}) {
  const roadmap = useAppStore((state) => state.data.roadmap);
  const applications = useAppStore((state) => state.data.applications);
  const updateWeek = useAppStore((state) => state.updateWeek);
  const setWeekStatus = useAppStore((state) => state.setWeekStatus);
  const setWeekProgress = useAppStore((state) => state.setWeekProgress);
  const addWeekTask = useAppStore((state) => state.addWeekTask);
  const toggleWeekTask = useAppStore((state) => state.toggleWeekTask);
  const deleteWeekTask = useAppStore((state) => state.deleteWeekTask);
  const { success } = useToast();
  const [taskTitle, setTaskTitle] = useState('');
  const [notes, setNotes] = useState(week?.notes ?? '');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    setNotes(week?.notes ?? '');
    setTaskTitle('');
    setTaskToDelete(null);
  }, [week?.id, week?.notes]);

  if (!week) return null;

  const previous = roadmap.find((item) => item.number === week.number - 1);
  const next = roadmap.find((item) => item.number === week.number + 1);
  const weekApplications = applications.filter(
    (application) =>
      application.applicationDate >= week.startDate && application.applicationDate <= week.endDate,
  ).length;
  const notesDirty = notes !== week.notes;

  const handleAddTask = () => {
    const title = taskTitle.trim();
    if (!title) return;
    addWeekTask(week.id, title);
    setTaskTitle('');
    success('Task added', { description: `Added to Week ${week.number}.` });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={`Week ${week.number} · ${week.title}`}
        description={`${getWeekLabel(week)} · ${week.technicalFocus.join(' · ')}`}
        size="xl"
        footer={
          <>
            <div className="mr-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => previous && onNavigate(previous)}
                disabled={!previous}
                aria-label="Previous week"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => next && onNavigate(next)}
                disabled={!next}
                aria-label="Next week"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <span className="ml-1 text-2xs text-muted-foreground">
                Week {week.number} of {roadmap.length}
              </span>
            </div>
            <Button variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              Edit plan
            </Button>
            {week.status === 'Completed' ? (
              <Button variant="secondary" onClick={() => setWeekStatus(week.id, 'In Progress')}>
                Reopen week
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setWeekStatus(week.id, 'Completed');
                  success('Week completed', { description: `Week ${week.number} marked complete.` });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark completed
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={week.status} />
            <Badge tone="outline">
              <CalendarDays className="h-3 w-3" />
              {formatDate(week.startDate, 'd MMM')} – {formatDate(week.endDate, 'd MMM yyyy')}
            </Badge>
            <Badge tone="outline">Application target {week.applicationTarget}</Badge>
            <Badge tone={weekApplications >= week.applicationTarget ? 'success' : 'warning'}>
              {weekApplications} applied this week
            </Badge>
          </div>

          <section className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium">Week progress</span>
                  <span className="tabular-nums text-muted-foreground">{week.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={week.progress}
                  onChange={(event) => setWeekProgress(week.id, Number(event.target.value))}
                  className="w-full accent-[hsl(var(--accent))]"
                  aria-label="Week progress"
                />
                <Progress value={week.progress} className="mt-2" />
              </div>
              <label className="flex shrink-0 flex-col gap-1 text-2xs text-muted-foreground">
                Status
                <select
                  value={week.status}
                  onChange={(event) => {
                    setWeekStatus(week.id, event.target.value as WeekStatus);
                    success('Week status updated');
                  }}
                  className="h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground"
                  aria-label="Week status"
                >
                  {WEEK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <DetailList title="Topics to study" items={week.topics} tone="accent" />
            <DetailList title="Hands-on exercises" items={week.exercises} />
            <DetailList title="Mock interview objectives" items={week.mockObjectives} />
            <DetailList title="Job-search activities" items={week.jobSearch} />
            <DetailList title="Expected deliverables" items={week.deliverables} />
            <DetailList title="Technical focus" items={week.technicalFocus} />
          </div>

          <section className="border-t border-border pt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Additional tasks
              </h3>
              <span className="text-2xs text-muted-foreground">
                {week.tasks.filter((task) => task.done).length}/{week.tasks.length} done
              </span>
            </div>
            <ul className="space-y-1">
              {week.tasks.map((task) => (
                <li key={task.id} className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted/50">
                  <button
                    type="button"
                    onClick={() => toggleWeekTask(week.id, task.id)}
                    className="text-muted-foreground transition-colors hover:text-accent"
                    aria-label={task.done ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
                  >
                    {task.done ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span className={cn('flex-1 text-xs', task.done && 'text-muted-foreground line-through')}>
                    {task.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTaskToDelete(task.id)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-danger group-hover:opacity-100"
                    aria-label={`Delete task ${task.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddTask();
                  }
                }}
                placeholder="Add a task for this week…"
                aria-label="New weekly task"
                className="h-8 text-xs"
              />
              <Button size="sm" variant="outline" onClick={handleAddTask} disabled={!taskTitle.trim()}>
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </section>

          <section className="border-t border-border pt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Personal notes
              </h3>
              {notesDirty ? <span className="text-2xs text-warning">Unsaved changes</span> : null}
            </div>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="What worked? What needs adjustment? Blockers, wins, follow-ups…"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={!notesDirty}
                onClick={() => {
                  updateWeek(week.id, { notes });
                  success('Notes saved', { description: `Week ${week.number} notes updated.` });
                }}
              >
                <Save className="h-3.5 w-3.5" />
                Save notes
              </Button>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 border-t border-border pt-5">
            <LinkButton to="/timetable" variant="outline" size="sm" onClick={onClose}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open timetable
            </LinkButton>
            <LinkButton to="/technical" variant="outline" size="sm" onClick={onClose}>
              <ExternalLink className="h-3.5 w-3.5" />
              Technical tracker
            </LinkButton>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete this task?"
        description="The task will be removed from this week's plan."
        confirmLabel="Delete task"
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            deleteWeekTask(week.id, taskToDelete);
            success('Task deleted');
          }
          setTaskToDelete(null);
        }}
      />
    </>
  );
}
