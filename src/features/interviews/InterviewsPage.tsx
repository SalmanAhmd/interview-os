import { useMemo, useState } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Download,
  MessageSquareText,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  Trophy,
} from 'lucide-react';
import type { InterviewRecord, InterviewResult } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput } from '../../components/common/SearchInput';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { Tabs } from '../../components/ui/tabs';
import { ConfirmDialog } from '../../components/ui/dialog';
import { formatDate, todayISO } from '../../lib/dates';
import { exportInterviewsCsv } from '../../lib/storage/backup';
import { InterviewFormDialog } from './InterviewFormDialog';
import { InterviewDetailDialog } from './InterviewDetailDialog';

const RESULTS: InterviewResult[] = ['Pending', 'Passed', 'Failed', 'Offer', 'No Show'];

export default function InterviewsPage() {
  const data = useAppStore((state) => state.data);
  const deleteInterview = useAppStore((state) => state.deleteInterview);
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<InterviewResult | 'All'>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InterviewRecord | null>(null);
  const [detail, setDetail] = useState<InterviewRecord | null>(null);
  const [toDelete, setToDelete] = useState<InterviewRecord | null>(null);

  const interviews = data.interviews;
  const today = todayISO();
  const passed = interviews.filter((item) => item.result === 'Passed').length;
  const offers = interviews.filter((item) => item.result === 'Offer').length;
  const pending = interviews.filter((item) => item.result === 'Pending').length;
  const upcomingRounds = interviews.filter(
    (item) => item.nextRoundDate && item.nextRoundDate >= today,
  ).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...interviews]
      .filter((interview) => {
        if (resultFilter !== 'All' && interview.result !== resultFilter) return false;
        if (!query) return true;
        return [
          interview.company,
          interview.round,
          interview.interviewerName,
          interview.questions,
          interview.topics.join(' '),
          interview.wentWell,
          interview.struggled,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [interviews, resultFilter, search]);

  const tabs = [
    { value: 'All', label: 'All', count: interviews.length },
    ...RESULTS.map((result) => ({
      value: result,
      label: result,
      count: interviews.filter((interview) => interview.result === result).length,
    })),
  ];

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (interview: InterviewRecord) => {
    setDetail(null);
    setEditing(interview);
    setFormOpen(true);
  };

  const handleExport = () => {
    exportInterviewsCsv(interviews);
    success('Interview log exported', { description: 'CSV download started.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feedback loop"
        title="Interview log"
        description="Record every real interview, capture feedback while it is fresh and turn gaps into concrete actions."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Log interview
            </Button>
          </>
        }
      />

      <section aria-label="Interview summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Interviews logged" value={interviews.length} hint={`${upcomingRounds} next rounds scheduled`} icon={MessageSquareText} />
        <StatCard label="Passed" value={passed} hint={`${offers} converted to offers`} icon={CheckCircle2} />
        <StatCard label="Awaiting result" value={pending} hint="Pending feedback or decisions" icon={Clock3} />
        <StatCard label="Offers" value={offers} hint={interviews.length ? `${Math.round((offers / interviews.length) * 100)}% of interviews` : 'No interviews yet'} icon={Trophy} />
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs items={tabs} value={resultFilter} onChange={(value) => setResultFilter(value as InterviewResult | 'All')} ariaLabel="Filter interviews by result" className="w-full lg:w-auto" />
        <SearchInput value={search} onChange={setSearch} placeholder="Search company, round, questions…" ariaLabel="Search interview log" className="w-full lg:w-72" />
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((interview) => {
            const application = data.applications.find((item) => item.id === interview.applicationId);
            return (
              <Card key={interview.id} className="group p-4 transition-colors hover:border-border/80">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="hidden h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/30 sm:flex">
                      <span className="text-base font-semibold tabular-nums">{formatDate(interview.date, 'd')}</span>
                      <span className="text-2xs uppercase tracking-wide text-muted-foreground">{formatDate(interview.date, 'MMM yyyy')}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetail(interview)}
                          className="text-left text-sm font-semibold hover:text-accent"
                        >
                          {interview.company}
                        </button>
                        <StatusBadge status={interview.result} />
                        <Badge tone="outline">{interview.round}</Badge>
                        {application ? <Badge tone="neutral">{application.stage}</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-2xs text-muted-foreground">
                        {formatDate(interview.date, 'EEEE, d MMM yyyy')}
                        {interview.interviewerName ? ` · ${interview.interviewerName}` : ''}
                        {interview.nextRoundDate ? ` · Next round ${formatDate(interview.nextRoundDate, 'd MMM')}` : ''}
                      </p>
                      {interview.topics.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {interview.topics.slice(0, 6).map((topic) => (
                            <Badge key={topic} tone="info">
                              {topic}
                            </Badge>
                          ))}
                          {interview.topics.length > 6 ? <Badge tone="neutral">+{interview.topics.length - 6}</Badge> : null}
                        </div>
                      ) : null}
                      {interview.struggled ? (
                        <p className="mt-2 line-clamp-2 max-w-3xl text-2xs leading-4 text-muted-foreground">
                          <span className="font-medium text-foreground/80">Struggled:</span> {interview.struggled}
                        </p>
                      ) : interview.questions ? (
                        <p className="mt-2 line-clamp-2 max-w-3xl text-2xs leading-4 text-muted-foreground">
                          <span className="font-medium text-foreground/80">Questions:</span> {interview.questions}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 lg:flex-col lg:items-end">
                    <Button variant="ghost" size="sm" onClick={() => setDetail(interview)}>
                      <MessageSquareText className="h-3.5 w-3.5" />
                      View feedback
                    </Button>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(interview)} aria-label={`Edit interview at ${interview.company}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(interview)} aria-label={`Delete interview at ${interview.company}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={search || resultFilter !== 'All' ? SearchX : CalendarCheck2}
          title={search || resultFilter !== 'All' ? 'No interviews match' : 'No interviews logged yet'}
          description={
            search || resultFilter !== 'All'
              ? 'Try a different result or search term to find the interview you are looking for.'
              : 'Log your first interview to capture feedback, questions and next-round actions while they are fresh.'
          }
          action={
            search || resultFilter !== 'All' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setResultFilter('All');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Log interview
              </Button>
            )
          }
        />
      )}

      <p className="text-2xs text-muted-foreground">
        Showing {filtered.length} of {interviews.length} interviews · last export includes all feedback fields.
      </p>

      <InterviewFormDialog open={formOpen} onClose={() => setFormOpen(false)} interview={editing} />
      <InterviewDetailDialog
        interview={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={setToDelete}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this interview record?"
        description={`The feedback, questions and outcome for ${toDelete?.company ?? 'this interview'} will be permanently removed.`}
        confirmLabel="Delete interview"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteInterview(toDelete.id);
            success('Interview deleted', { description: `${toDelete.company} · ${toDelete.round}` });
          }
          setToDelete(null);
          setDetail(null);
        }}
      />
    </div>
  );
}
