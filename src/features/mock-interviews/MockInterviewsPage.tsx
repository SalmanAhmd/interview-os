import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  CalendarDays,
  Gauge,
  Mic2,
  Pencil,
  Plus,
  SearchX,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import type { MockInterview, MockInterviewType } from '../../types';
import { MOCK_INTERVIEW_TYPES } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput } from '../../components/common/SearchInput';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { Tabs } from '../../components/ui/tabs';
import { Select } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { ConfirmDialog } from '../../components/ui/dialog';
import { InterviewPerformanceChart } from '../../components/charts/InterviewChart';
import { formatDate, todayISO } from '../../lib/dates';
import { average, formatDuration } from '../../lib/utils';
import { MockFormDialog } from './MockFormDialog';
import { MockDetailDialog } from './MockDetailDialog';

type SortMode = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc';

export default function MockInterviewsPage() {
  const data = useAppStore((state) => state.data);
  const deleteMock = useAppStore((state) => state.deleteMock);
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MockInterviewType | 'All'>('All');
  const [sort, setSort] = useState<SortMode>('date-desc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MockInterview | null>(null);
  const [detail, setDetail] = useState<MockInterview | null>(null);
  const [toDelete, setToDelete] = useState<MockInterview | null>(null);

  const mocks = data.mockInterviews;
  const averageScore = average(mocks.map((mock) => mock.score));
  const bestScore = mocks.length ? Math.max(...mocks.map((mock) => mock.score)) : 0;
  const monthPrefix = todayISO().slice(0, 7);
  const thisMonth = mocks.filter((mock) => mock.date.startsWith(monthPrefix)).length;
  const readyCount = mocks.filter((mock) => mock.score >= 7).length;

  const trend = useMemo(
    () =>
      [...mocks]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-8)
        .map((mock) => ({
          label: format(new Date(`${mock.date}T00:00:00`), 'd MMM'),
          score: mock.score,
          type: mock.type,
        })),
    [mocks],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = mocks.filter((mock) => {
      if (typeFilter !== 'All' && mock.type !== typeFilter) return false;
      if (!query) return true;
      return [mock.type, mock.topics.join(' '), mock.strengths, mock.weaknesses, mock.feedback]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
    return [...rows].sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return a.date.localeCompare(b.date);
        case 'score-desc':
          return b.score - a.score || b.date.localeCompare(a.date);
        case 'score-asc':
          return a.score - b.score || b.date.localeCompare(a.date);
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [mocks, search, sort, typeFilter]);

  const tabs = [
    { value: 'All', label: 'All', count: mocks.length },
    ...MOCK_INTERVIEW_TYPES.map((type) => ({
      value: type,
      label: type,
      count: mocks.filter((mock) => mock.type === type).length,
    })),
  ];

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (mock: MockInterview) => {
    setDetail(null);
    setEditing(mock);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Practice loop"
        title="Mock interviews"
        description="Simulate the real thing, score yourself honestly and track the trend across JavaScript, React, system design and more."
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Log mock interview
          </Button>
        }
      />

      <section aria-label="Mock interview summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mocks completed" value={mocks.length} hint={`${readyCount} scored 7 or higher`} icon={Mic2} />
        <StatCard label="Average score" value={mocks.length ? `${averageScore.toFixed(1)}/10` : '—'} hint="Across all mock types" icon={Gauge} />
        <StatCard label="Best score" value={mocks.length ? `${bestScore.toFixed(1)}/10` : '—'} hint="Personal best so far" icon={Trophy} />
        <StatCard label="This month" value={thisMonth} hint="Mocks logged since the 1st" icon={CalendarDays} />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <InterviewPerformanceChart data={trend} average={averageScore} />
        </div>
        <Card className="flex flex-col justify-between p-5">
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Practice insight</p>
            <h2 className="mt-1 text-sm font-semibold">Keep the feedback loop tight</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {mocks.length
                ? `You have completed ${mocks.length} mock${mocks.length === 1 ? '' : 's'}. ${
                    averageScore >= 7
                      ? 'Scores are in interview-ready territory — focus on consistency under pressure.'
                      : 'Pick the lowest-scoring feedback and turn it into one action this week.'
                  }`
                : 'Log your first mock to start measuring readiness instead of guessing.'}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {MOCK_INTERVIEW_TYPES.slice(0, 4).map((type) => {
              const typeMocks = mocks.filter((mock) => mock.type === type);
              const score = average(typeMocks.map((mock) => mock.score));
              return (
                <div key={type}>
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-medium tabular-nums">{typeMocks.length ? `${score.toFixed(1)}/10` : '—'}</span>
                  </div>
                  <Progress value={score * 10} className="mt-1 h-1" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs items={tabs} value={typeFilter} onChange={(value) => setTypeFilter(value as MockInterviewType | 'All')} ariaLabel="Filter mocks by type" className="w-full lg:w-auto" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search topics, feedback…" ariaLabel="Search mock interviews" className="w-full sm:w-64" />
          <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="sm:w-40" aria-label="Sort mock interviews">
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="score-desc">Highest score</option>
            <option value="score-asc">Lowest score</option>
          </Select>
        </div>
      </div>

      {filtered.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((mock) => {
            const tone = mock.score >= 7 ? 'success' : mock.score >= 5 ? 'warning' : 'danger';
            return (
              <Card key={mock.id} className="group p-4 transition-colors hover:border-border/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetail(mock)}
                        className="text-left text-sm font-semibold hover:text-accent"
                      >
                        {mock.type}
                      </button>
                      <Badge tone={tone}>{mock.score.toFixed(1)}/10</Badge>
                      <Badge tone="outline">{formatDuration(mock.durationMinutes)}</Badge>
                    </div>
                    <p className="mt-0.5 text-2xs text-muted-foreground">
                      {formatDate(mock.date, 'EEE, d MMM yyyy')}
                      {mock.topics.length ? ` · ${mock.topics.length} topics` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => setDetail(mock)} aria-label={`View ${mock.type} mock`}>
                      <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(mock)} aria-label={`Edit ${mock.type} mock`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(mock)} aria-label={`Delete ${mock.type} mock`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Progress value={mock.score * 10} className="mt-3 h-1" />

                {mock.topics.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {mock.topics.slice(0, 7).map((topic) => (
                      <Badge key={topic} tone="info">
                        {topic}
                      </Badge>
                    ))}
                    {mock.topics.length > 7 ? <Badge tone="neutral">+{mock.topics.length - 7}</Badge> : null}
                  </div>
                ) : null}

                {mock.weaknesses ? (
                  <p className="mt-2 line-clamp-2 text-2xs leading-4 text-muted-foreground">
                    <span className="font-medium text-foreground/80">Gap:</span> {mock.weaknesses}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-2xs text-muted-foreground">
                    {mock.actionItems ? 'Action items recorded' : 'No action items yet'}
                  </span>
                  <Button variant="link" size="sm" onClick={() => setDetail(mock)}>
                    View details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={search || typeFilter !== 'All' ? SearchX : Mic2}
          title={search || typeFilter !== 'All' ? 'No mocks match' : 'No mock interviews yet'}
          description={
            search || typeFilter !== 'All'
              ? 'Try a different type or search term to find the mock you are looking for.'
              : 'Log a mock with a score and honest feedback. A handful of focused sessions will reveal your real gaps.'
          }
          action={
            search || typeFilter !== 'All' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('All');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Log mock interview
              </Button>
            )
          }
        />
      )}

      <MockFormDialog open={formOpen} onClose={() => setFormOpen(false)} mock={editing} />
      <MockDetailDialog
        mock={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={setToDelete}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this mock interview?"
        description={`The ${toDelete?.type ?? 'mock'} score and feedback will be permanently removed from your practice history.`}
        confirmLabel="Delete mock"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteMock(toDelete.id);
            success('Mock interview deleted', { description: `${toDelete.type} · ${toDelete.score}/10` });
          }
          setToDelete(null);
          setDetail(null);
        }}
      />
    </div>
  );
}
