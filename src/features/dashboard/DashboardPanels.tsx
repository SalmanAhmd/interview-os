import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarRange,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Mic2,
  NotebookPen,
  Square,
  Target,
  TriangleAlert,
} from 'lucide-react';
import type { ActivityItem, RoadmapWeek, Task } from '../../types';
import type { DashboardData, ImprovementArea, UpcomingInterview } from '../../lib/analytics/dashboard';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Progress, ProgressRing } from '../../components/ui/progress';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { cn, formatDuration } from '../../lib/utils';
import { formatDate, formatTime, getWeekLabel, relativeTime, todayISO } from '../../lib/dates';
import { getDayStudyStats } from '../../lib/analytics/timetable';
import { LinkButton } from '../../components/common/LinkButton';

function applicationsThisWeekCount(week: RoadmapWeek | undefined, applications: { applicationDate: string }[]) {
  if (!week) return 0;
  return applications.filter(
    (application) =>
      application.applicationDate >= week.startDate && application.applicationDate <= week.endDate,
  ).length;
}

export function CurrentWeekPanel({
  week,
  metrics,
}: {
  week?: RoadmapWeek;
  metrics: DashboardData;
}) {
  const applications = useAppStore((state) => state.data.applications);
  const weekApplications = applicationsThisWeekCount(week, applications);

  if (!week) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader title="Current preparation week" description="No roadmap data available" />
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Restore the default roadmap from Settings to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Current preparation week"
        description={`Week ${week.number} of ${metrics.totalWeeks} · ${getWeekLabel(week)}`}
        action={<StatusBadge status={week.status} />}
      />
      <CardContent className="pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight">{week.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {week.technicalFocus.slice(0, 3).join(' · ')}
            </p>
          </div>
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="text-2xl font-semibold tabular-nums">{week.progress}%</span>
            <span className="text-2xs text-muted-foreground">complete</span>
          </div>
        </div>
        <Progress value={week.progress} className="mt-3" label={`Week ${week.number} progress`} />

        <div className="mt-4 flex flex-wrap gap-1.5">
          {week.technicalFocus.slice(0, 4).map((focus) => (
            <Badge key={focus} tone="outline">
              {focus}
            </Badge>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <p className="text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Weeks completed
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {metrics.completedWeeks} completed
              <span className="font-normal text-muted-foreground">
                {' '}
                · {metrics.totalWeeks - metrics.completedWeeks} pending
              </span>
            </p>
          </div>
          <div>
            <p className="text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Weekly deliverables
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {metrics.currentWeek?.tasks.filter((task) => task.done).length ?? 0} done
              <span className="font-normal text-muted-foreground">
                {' '}
                · {metrics.currentWeek?.tasks.filter((task) => !task.done).length ?? week.deliverables.length}{' '}
                pending
              </span>
            </p>
          </div>
          <div>
            <p className="text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Application target
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {weekApplications} / {week.applicationTarget}
              <span className="font-normal text-muted-foreground"> this week</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <LinkButton to={`/roadmap?week=${week.number}`} variant="outline" size="sm">
            Open weekly plan
            <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
          <LinkButton to="/timetable" variant="ghost" size="sm">
            <Clock3 className="h-3.5 w-3.5" />
            Study timetable
          </LinkButton>
          {week.applicationTarget > 0 && weekApplications < week.applicationTarget ? (
            <Badge tone="warning">
              {week.applicationTarget - weekApplications} applications behind target
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function TodayPanel({ metrics }: { metrics: DashboardData }) {
  const data = useAppStore((state) => state.data);
  const setSlotStatus = useAppStore((state) => state.setSlotStatus);
  const { success } = useToast();
  const date = new Date();
  const stats = getDayStudyStats(data, date);
  const today = todayISO();
  const log = data.dailyLogs[today];

  return (
    <Card>
      <CardHeader
        title="Today's study plan"
        description={formatDate(date, 'EEEE, d MMM')}
        action={<ProgressRing value={metrics.todayCompletion} size={42} strokeWidth={4} label="Daily study completion" />}
      />
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {metrics.todayDoneSlots} of {metrics.todayTotalSlots} activities
          </span>
          <span className="tabular-nums">
            {formatDuration(metrics.todayCompletedMinutes)} / {formatDuration(metrics.todayPlannedMinutes)}
          </span>
        </div>
        {stats.slots.length ? (
          <ul className="space-y-1">
            {stats.slots.map((slot) => {
              const status = log?.statuses?.[slot.id];
              const done = status === 'done';
              const skipped = status === 'skipped';
              return (
                <li
                  key={slot.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/50',
                    done && 'text-muted-foreground',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSlotStatus(today, slot.id, done ? null : 'done');
                      if (!done) success('Study activity completed', { description: slot.title });
                    }}
                    className="rounded p-0.5 text-muted-foreground transition-colors hover:text-accent"
                    aria-label={done ? `Mark ${slot.title} as incomplete` : `Mark ${slot.title} complete`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : skipped ? (
                      <Clock3 className="h-4 w-4 text-warning" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-xs font-medium', done && 'line-through')}>
                      {slot.title}
                    </p>
                    <p className="text-2xs text-muted-foreground">
                      {formatTime(slot.startTime)} · {slot.durationMinutes}m
                      {skipped ? ' · skipped' : ''}
                    </p>
                  </div>
                  {!done && !skipped ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSlotStatus(today, slot.id, 'skipped');
                        success('Activity skipped', { description: slot.title });
                      }}
                      className="rounded px-1.5 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Skip
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-6 text-center">
            <p className="text-xs text-muted-foreground">No study activities scheduled today.</p>
            <LinkButton to="/timetable" variant="ghost" size="sm" className="mt-2">
              Plan today
            </LinkButton>
          </div>
        )}
        <Link
          to="/timetable"
          className="mt-3 flex items-center justify-center gap-1 rounded-md border border-border py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Open full timetable
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function PipelineStrip({ metrics }: { metrics: DashboardData }) {
  const items = [
    { label: 'Applications', value: metrics.totalApplications, icon: Briefcase },
    { label: 'Active pipeline', value: metrics.activeApplications, icon: Target },
    { label: 'Upcoming interviews', value: metrics.interviewsScheduled, icon: CalendarRange },
    { label: 'Offers', value: metrics.offers, icon: CheckCircle2 },
    { label: 'Mock average', value: `${metrics.mockAverage.toFixed(1)}/10`, icon: Mic2 },
    { label: 'Study streak', value: `${metrics.studyStreak}d`, icon: Clock3 },
  ];

  return (
    <Card>
      <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6 lg:divide-x">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-2.5 px-4 py-3',
                index >= 2 && 'sm:border-t sm:border-border lg:border-t-0',
                index === 2 && 'sm:border-l-0',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-2xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold tabular-nums">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function UpcomingInterviewsPanel({ items }: { items: UpcomingInterview[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Upcoming interviews"
        description={`${items.length} scheduled`}
        action={
          <Link to="/applications" className="text-2xs font-medium text-muted-foreground hover:text-foreground">
            Pipeline
          </Link>
        }
      />
      <CardContent className="flex-1 pt-4">
        {items.length ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 rounded-lg border border-border/70 p-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-accent/10 text-accent">
                    <span className="text-2xs font-medium leading-3">
                      {formatDate(item.date, 'MMM').toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold leading-4">{formatDate(item.date, 'd')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.company}</p>
                    <p className="truncate text-2xs text-muted-foreground">{item.round}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <CalendarRange className="mb-2 h-5 w-5 text-muted-foreground/70" aria-hidden="true" />
            <p className="text-xs font-medium">No interviews scheduled</p>
            <p className="mt-1 max-w-[220px] text-2xs leading-5 text-muted-foreground">
              Add a next interview date to an application or log a next round.
            </p>
            <LinkButton to="/applications" variant="outline" size="sm" className="mt-3">
              Open applications
            </LinkButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingTasksPanel({
  tasks,
  week,
}: {
  tasks: Task[];
  week?: RoadmapWeek;
}) {
  const toggleTaskStatus = useAppStore((state) => state.toggleTaskStatus);
  const { success } = useToast();
  const nextDeliverable = week?.deliverables[0];

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Upcoming tasks"
        description={tasks.length ? `${tasks.length} open items` : 'Tasks and milestones'}
        action={
          <Link to="/tasks" className="text-2xs font-medium text-muted-foreground hover:text-foreground">
            View all
          </Link>
        }
      />
      <CardContent className="flex-1 pt-4">
        {tasks.length ? (
          <ul className="space-y-1">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/40"
              >
                <button
                  type="button"
                  onClick={() => {
                    toggleTaskStatus(task.id);
                    success('Task completed', { description: task.title });
                  }}
                  className="mt-0.5 text-muted-foreground transition-colors hover:text-success"
                  aria-label={`Mark ${task.title} complete`}
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{task.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
                    <Badge tone={task.priority === 'Urgent' ? 'danger' : task.priority === 'High' ? 'warning' : 'neutral'}>
                      {task.priority}
                    </Badge>
                    {task.dueDate ? <span>Due {formatDate(task.dueDate, 'd MMM')}</span> : null}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <Check className="mb-2 h-5 w-5 text-muted-foreground/70" aria-hidden="true" />
            <p className="text-xs font-medium">No open tasks</p>
            {nextDeliverable ? (
              <p className="mt-1 max-w-[240px] text-2xs leading-5 text-muted-foreground">
                Next weekly deliverable: {nextDeliverable}
              </p>
            ) : (
              <p className="mt-1 text-2xs text-muted-foreground">Add a task to keep momentum.</p>
            )}
            <LinkButton to="/tasks" variant="outline" size="sm" className="mt-3">
              Add a task
            </LinkButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const activityIcons = {
  application: Briefcase,
  interview: CalendarRange,
  mock: Mic2,
  task: CheckCircle2,
  goal: Target,
  note: NotebookPen,
  company: Building2,
  week: CalendarRange,
} as const;

export function RecentActivityPanel({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Recent activity" description="Latest changes across your workspace" />
      <CardContent className="pt-3">
        {items.length ? (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const Icon = activityIcons[item.type];
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-3 py-2.5 transition-colors hover:text-foreground"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.title}</p>
                      <p className="truncate text-2xs text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="shrink-0 text-2xs text-muted-foreground">
                      {relativeTime(item.timestamp)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">Activity will appear here as you use the app.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ImprovementPanel({ areas }: { areas: ImprovementArea[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Areas to improve"
        description={areas.length ? 'Highest-leverage gaps right now' : 'No urgent gaps detected'}
        action={
          <Link to="/technical" className="text-2xs font-medium text-muted-foreground hover:text-foreground">
            Technical
          </Link>
        }
      />
      <CardContent className="flex-1 pt-3">
        {areas.length ? (
          <ul className="space-y-2">
            {areas.map((area) => (
              <li key={area.id}>
                <Link
                  to={area.href}
                  className="flex items-start gap-2.5 rounded-lg border border-border/70 p-2.5 transition-colors hover:bg-muted/40"
                >
                  {area.severity === 'high' ? (
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
                  ) : (
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-5">{area.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-2xs leading-4 text-muted-foreground">
                      {area.detail}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="mb-2 h-5 w-5 text-success" aria-hidden="true" />
            <p className="text-xs font-medium">You are on track</p>
            <p className="mt-1 max-w-[220px] text-2xs leading-5 text-muted-foreground">
              No low-confidence topics or overdue follow-ups detected.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
