import { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  BriefcaseBusiness,
  CalendarClock,
  Download,
  ExternalLink,
  KanbanSquare,
  LayoutList,
  Pencil,
  Plus,
  SearchX,
  TableProperties,
  Trash2,
} from 'lucide-react';
import type { ApplicationStage, JobApplication } from '../../types';
import { ACTIVE_STAGES, APPLICATION_STAGES } from '../../types';
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
import { Select } from '../../components/ui/input';
import { ConfirmDialog } from '../../components/ui/dialog';
import { formatDate, isPastDate, todayISO } from '../../lib/dates';
import { computeApplicationMetrics } from '../../lib/analytics/dashboard';
import { exportApplicationsCsv } from '../../lib/storage/backup';
import { externalHref } from '../../lib/links';
import { ApplicationFormDialog } from './ApplicationFormDialog';
import { ApplicationDetailDialog } from './ApplicationDetailDialog';

type ViewMode = 'kanban' | 'table';

const stageColors: Record<ApplicationStage, string> = {
  'To Research': 'border-border',
  'Referral Requested': 'border-border',
  Applied: 'border-accent/40',
  'Recruiter Screen': 'border-warning/40',
  'Technical Round': 'border-warning/40',
  'Machine Coding Round': 'border-warning/40',
  'System Design Round': 'border-warning/40',
  'Hiring Manager Round': 'border-warning/40',
  'HR / Offer': 'border-warning/40',
  'Offer Received': 'border-success/40',
  Rejected: 'border-danger/40',
  Withdrawn: 'border-border',
  'On Hold': 'border-border',
};

export default function ApplicationsPage() {
  const data = useAppStore((state) => state.data);
  const setApplicationStage = useAppStore((state) => state.setApplicationStage);
  const deleteApplication = useAppStore((state) => state.deleteApplication);
  const { success } = useToast();
  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<ApplicationStage | 'All'>('All');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<JobApplication | null>(null);

  const metrics = computeApplicationMetrics(data);
  const apps = data.applications;
  const detail = apps.find((application) => application.id === detailId) ?? null;
  const activeApplications = apps.filter((application) => ACTIVE_STAGES.includes(application.stage)).length;
  const now = todayISO();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return apps.filter((application) => {
      if (stageFilter !== 'All' && application.stage !== stageFilter) return false;
      if (showActiveOnly && !ACTIVE_STAGES.includes(application.stage)) return false;
      if (!query) return true;
      return [
        application.companyName,
        application.role,
        application.location,
        application.recruiterName,
        application.referralSource,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [apps, search, stageFilter, showActiveOnly]);

  const boardStages = useMemo(
    () => APPLICATION_STAGES.filter((stage) => stageFilter === 'All' || stage === stageFilter),
    [stageFilter],
  );

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (application: JobApplication) => {
    setDetailId(null);
    setEditing(application);
    setFormOpen(true);
  };

  const handleExport = () => {
    exportApplicationsCsv(apps);
    success('Applications exported', { description: 'CSV download started.' });
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteApplication(toDelete.id);
    success('Application removed', { description: toDelete.companyName });
    setToDelete(null);
    setDetailId(null);
  };

  const tabs = [
    { value: 'kanban', label: 'Kanban', icon: <KanbanSquare className="h-3.5 w-3.5" /> },
    { value: 'table', label: 'Table', icon: <TableProperties className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Job search pipeline"
        title="Applications"
        description="Track every application from first touch to offer. Manage stages, follow-ups and recruiter contacts."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add application
            </Button>
          </>
        }
      />

      <section aria-label="Application metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={metrics.total} hint={`${activeApplications} active`} icon={BriefcaseBusiness} />
        <StatCard label="Screened / Applied" value={`${metrics.applicationToScreenRate}%`} hint={`${metrics.screened} screened`} icon={ArrowRightLeft} />
        <StatCard label="Interview rate" value={`${metrics.screenToInterviewRate}%`} hint={`${metrics.interviewed} got interviews`} icon={LayoutList} />
        <StatCard label="Interview → Offer" value={`${metrics.interviewToOfferRate}%`} hint={`${metrics.offers} offers`} icon={CalendarClock} />
      </section>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs items={tabs} value={view} onChange={(value) => setView(value as ViewMode)} ariaLabel="Application view" />
            <div className="flex items-center gap-1.5 rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => setShowActiveOnly(false)}
                className={`rounded px-2 py-1 text-xs ${!showActiveOnly ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setShowActiveOnly(true)}
                className={`rounded px-2 py-1 text-xs ${showActiveOnly ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              >
                Active only
              </button>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as ApplicationStage | 'All')}>
                <option value="All">All stages</option>
                {APPLICATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search company, role, recruiter…" ariaLabel="Search applications" className="w-full lg:w-72" />
        </div>

        {view === 'kanban' ? (
          <div className="kanban-scroll overflow-x-auto">
            <div className="flex min-w-max gap-3 p-3">
              {boardStages.map((stage) => {
                const stageApps = filtered
                  .filter((application) => application.stage === stage)
                  .sort((a, b) => (b.followUpDate || '').localeCompare(a.followUpDate || '') || b.updatedAt.localeCompare(a.updatedAt));
                const followUps = stageApps.filter(
                  (application) =>
                    application.followUpDate &&
                    application.followUpDate <= now &&
                    ACTIVE_STAGES.includes(application.stage),
                ).length;
                const nextInterviews = stageApps.filter(
                  (application) => application.nextInterviewDate && application.nextInterviewDate >= now,
                ).length;
                return (
                  <section
                    key={stage}
                    className={`flex w-[280px] flex-col rounded-lg border bg-muted/10 ${stageColors[stage]}`}
                    aria-label={stage}
                  >
                    <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold">{stage}</h3>
                        <Badge tone="neutral">{stageApps.length}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                        {nextInterviews ? <span>{nextInterviews} upcoming</span> : null}
                        {followUps ? <span className="text-danger">{followUps} follow-ups</span> : null}
                      </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-2 p-2">
                      {stageApps.length ? (
                        stageApps.map((application) => {
                          const website = externalHref(application.website);
                          const overdueFollowUp =
                            application.followUpDate &&
                            application.followUpDate <= now &&
                            ACTIVE_STAGES.includes(application.stage);
                          return (
                            <article
                              key={application.id}
                              className="group rounded-lg border border-border bg-card p-3 shadow-xs transition-shadow hover:shadow-sm"
                            >
                              <button
                                type="button"
                                onClick={() => setDetailId(application.id)}
                                className="w-full text-left"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold">{application.companyName}</p>
                                    <p className="truncate text-2xs text-muted-foreground">{application.role}</p>
                                  </div>
                                  {website ? (
                                    <a
                                      href={website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                                      onClick={(event) => event.stopPropagation()}
                                      aria-label={`Open ${application.companyName} website`}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  ) : null}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <Badge tone="outline">{application.workMode}</Badge>
                                  {application.expectedCtc ? <Badge tone="info">{application.expectedCtc}</Badge> : null}
                                  {application.location ? <Badge tone="neutral">{application.location}</Badge> : null}
                                </div>
                                {application.nextInterviewDate && application.nextInterviewDate >= now ? (
                                  <p className="mt-2 text-2xs text-warning">
                                    Interview {formatDate(application.nextInterviewDate)}
                                  </p>
                                ) : null}
                                {overdueFollowUp ? (
                                  <p className="mt-1 text-2xs text-danger">
                                    Follow-up due {formatDate(application.followUpDate)}
                                  </p>
                                ) : null}
                              </button>
                              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                                <select
                                  value={application.stage}
                                  onChange={(event) =>
                                    setApplicationStage(
                                      application.id,
                                      event.target.value as ApplicationStage,
                                      'Moved from board',
                                    )
                                  }
                                  className="h-7 rounded-md border border-border bg-card px-1.5 text-2xs"
                                  aria-label="Change stage"
                                >
                                  {APPLICATION_STAGES.map((nextStage) => (
                                    <option key={nextStage} value={nextStage}>
                                      Move to {nextStage}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => openEdit(application)}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  aria-label="Quick edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <p className="px-2 py-4 text-center text-2xs text-muted-foreground">No applications</p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-2xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Company</th>
                  <th className="px-5 py-2.5 font-medium">Role</th>
                  <th className="px-5 py-2.5 font-medium">Stage</th>
                  <th className="px-5 py-2.5 font-medium">Location</th>
                  <th className="px-5 py-2.5 font-medium">Applied</th>
                  <th className="px-5 py-2.5 font-medium">Next interview</th>
                  <th className="px-5 py-2.5 font-medium">Follow-up</th>
                  <th className="px-5 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length ? (
                  filtered.map((application) => {
                    const website = externalHref(application.website);
                    return (
                      <tr key={application.id} className="group hover:bg-muted/15">
                        <td className="px-5 py-2.5">
                          <button
                            type="button"
                            onClick={() => setDetailId(application.id)}
                            className="text-left font-medium text-foreground hover:text-accent"
                          >
                            {application.companyName}
                          </button>
                          {website ? (
                            <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1.5 inline-flex items-center gap-0.5 text-2xs text-accent"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : null}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground">{application.role}</td>
                        <td className="px-5 py-2.5">
                          <StatusBadge status={application.stage} />
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground">{application.location || '—'}</td>
                        <td className="px-5 py-2.5 text-muted-foreground">{formatDate(application.applicationDate)}</td>
                        <td className="px-5 py-2.5 text-muted-foreground">{formatDate(application.nextInterviewDate)}</td>
                        <td className="px-5 py-2.5">
                          {application.followUpDate ? (
                            <span className={isPastDate(application.followUpDate) && ACTIVE_STAGES.includes(application.stage) ? 'text-danger' : 'text-muted-foreground'}>
                              {formatDate(application.followUpDate)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100">
                            <Button variant="ghost" size="icon-sm" onClick={() => setDetailId(application.id)} aria-label="View details">
                              <LayoutList className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(application)} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(application)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={SearchX}
                        title="No applications match"
                        description="Adjust filters or add your first application to start tracking your pipeline."
                        action={<Button onClick={openAdd}><Plus className="h-4 w-4" />Add application</Button>}
                        compact
                        className="m-3"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ApplicationFormDialog open={formOpen} onClose={() => setFormOpen(false)} application={editing} />
      <ApplicationDetailDialog
        application={detail}
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
        onDelete={setToDelete}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove this application?"
        description={`This will delete ${toDelete?.companyName} and unlink any interviews tied to it. Stage history will be lost.`}
        confirmLabel="Remove application"
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
