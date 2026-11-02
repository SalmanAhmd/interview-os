import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  Download,
  Gauge,
  RotateCcw,
  SearchX,
  TriangleAlert,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { LinkButton } from '../../components/common/LinkButton';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput } from '../../components/common/SearchInput';
import { EmptyState } from '../../components/ui/empty-state';
import { Tabs } from '../../components/ui/tabs';
import type { RoadmapWeek, WeekStatus } from '../../types';
import { getWeekForDate } from '../../lib/dates';
import { average, percent } from '../../lib/utils';
import { exportRoadmapCsv } from '../../lib/storage/backup';
import { WeekCard } from './WeekCard';
import { WeekDetailDialog } from './WeekDetailDialog';
import { WeekEditDialog } from './WeekEditDialog';

const statusFilters: (WeekStatus | 'All')[] = [
  'All',
  'In Progress',
  'Not Started',
  'Completed',
  'Needs Revision',
  'On Hold',
];

export default function RoadmapPage() {
  const roadmap = useAppStore((state) => state.data.roadmap);
  const setWeekStatus = useAppStore((state) => state.setWeekStatus);
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WeekStatus | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentWeek = getWeekForDate(roadmap);
  const selectedWeek = useMemo(() => {
    const value = Number(searchParams.get('week'));
    if (!Number.isFinite(value)) return null;
    return roadmap.find((week) => week.number === value) ?? null;
  }, [roadmap, searchParams]);
  const editingWeek = roadmap.find((week) => week.id === editingId) ?? null;

  const completed = roadmap.filter((week) => week.status === 'Completed').length;
  const inProgress = roadmap.filter((week) => week.status === 'In Progress').length;
  const needsRevision = roadmap.filter((week) => week.status === 'Needs Revision').length;
  const overallProgress = Math.round(average(roadmap.map((week) => week.progress)));
  const totalApplicationTarget = roadmap.reduce((sum, week) => sum + week.applicationTarget, 0);

  const filtered = roadmap.filter((week) => {
    const matchesStatus = statusFilter === 'All' || week.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      week.title.toLowerCase().includes(query) ||
      week.technicalFocus.some((focus) => focus.toLowerCase().includes(query)) ||
      week.topics.some((topic) => topic.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const tabs = statusFilters.map((status) => ({
    value: status,
    label: status,
    count:
      status === 'All' ? roadmap.length : roadmap.filter((week) => week.status === status).length,
  }));

  const openWeek = (week: RoadmapWeek) => setSearchParams({ week: String(week.number) });

  const handleMarkComplete = (week: RoadmapWeek) => {
    setWeekStatus(week.id, 'Completed');
    success('Week completed', { description: `Week ${week.number}: ${week.title}` });
  };

  const handleReopen = (week: RoadmapWeek) => {
    setWeekStatus(week.id, 'In Progress');
    success('Week reopened', { description: `Week ${week.number} is now in progress.` });
  };

  const handleExport = () => {
    exportRoadmapCsv(roadmap);
    success('Roadmap exported', { description: 'CSV download started.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preparation plan · 2 Nov 2026 – 31 Mar 2027"
        title="Weekly roadmap"
        description="A 22-week plan from baseline assessment to career transition. Track weekly objectives, deliverables and application targets."
        actions={
          <>
            <LinkButton to="/timetable" variant="outline">
              <Clock3 className="h-4 w-4" />
              Study timetable
            </LinkButton>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        }
      />

      <section aria-label="Roadmap summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall roadmap progress"
          value={`${overallProgress}%`}
          hint={`${completed} of ${roadmap.length} weeks completed`}
          icon={Gauge}
        />
        <StatCard
          label="Weeks completed"
          value={completed}
          hint={`${percent(completed, roadmap.length)}% of the preparation plan`}
          icon={CheckCircle2}
        />
        <StatCard
          label="In progress"
          value={inProgress}
          hint={currentWeek ? `Current: Week ${currentWeek.number} · ${currentWeek.title}` : 'No active week'}
          icon={CalendarRange}
        />
        <StatCard
          label="Needs revision"
          value={needsRevision}
          hint={`${totalApplicationTarget} total application target`}
          icon={TriangleAlert}
        />
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          items={tabs}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as WeekStatus | 'All')}
          ariaLabel="Filter roadmap by status"
          className="w-full lg:w-auto"
        />
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search weeks, topics, focus…"
            ariaLabel="Search roadmap"
            className="w-full sm:w-64"
          />
          <button
            type="button"
            onClick={() => {
              if (!currentWeek) return;
              document
                .getElementById(`roadmap-week-${currentWeek.number}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium shadow-xs transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Current week
          </button>
        </div>
      </div>

      {filtered.length ? (
        <section aria-label="Roadmap weeks" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              current={currentWeek?.id === week.id}
              onOpen={() => openWeek(week)}
              onEdit={() => setEditingId(week.id)}
              onComplete={() => handleMarkComplete(week)}
              onReopen={() => handleReopen(week)}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No weeks match these filters"
          description="Try a different status or search term to find the week you are looking for."
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
              }}
              className="inline-flex h-8 items-center rounded-md border border-border bg-card px-3 text-xs font-medium transition-colors hover:bg-muted"
            >
              Clear filters
            </button>
          }
        />
      )}

      <WeekDetailDialog
        week={selectedWeek}
        open={Boolean(selectedWeek)}
        onClose={() => setSearchParams({})}
        onEdit={() => {
          if (selectedWeek) {
            setEditingId(selectedWeek.id);
            setSearchParams({});
          }
        }}
        onNavigate={openWeek}
      />

      <WeekEditDialog
        week={editingWeek}
        open={Boolean(editingWeek)}
        onClose={() => setEditingId(null)}
      />
    </div>
  );
}
