import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  History,
  Mail,
  Pencil,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { ApplicationStage, JobApplication } from '../../types';
import { APPLICATION_STAGES, ACTIVE_STAGES } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { Field } from '../../components/ui/field';
import { Input, Select } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatDateTime, relativeTime, todayISO } from '../../lib/dates';
import { externalHref } from '../../lib/links';

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-xs text-foreground">{value || '—'}</dd>
    </div>
  );
}

export function ApplicationDetailDialog({
  application,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  application: JobApplication | null;
  open: boolean;
  onClose: () => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
}) {
  const setApplicationStage = useAppStore((state) => state.setApplicationStage);
  const { success } = useToast();
  const [pendingStage, setPendingStage] = useState<ApplicationStage>('To Research');
  const [stageNote, setStageNote] = useState('');

  useEffect(() => {
    if (application) {
      setPendingStage(application.stage);
      setStageNote('');
    }
  }, [application]);

  if (!application) return null;

  const website = externalHref(application.website);
  const active = ACTIVE_STAGES.includes(application.stage);
  const followUpOverdue =
    application.followUpDate && application.followUpDate <= todayISO() && active;
  const nextInterviewSoon =
    application.nextInterviewDate && application.nextInterviewDate >= todayISO() && active;

  const changeStage = () => {
    if (pendingStage === application.stage) return;
    setApplicationStage(application.id, pendingStage, stageNote.trim());
    success('Stage updated', { description: `${application.companyName} → ${pendingStage}` });
    setStageNote('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={application.companyName}
      description={`${application.role || 'Frontend role'}${application.location ? ` · ${application.location}` : ''}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onDelete(application)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(application)}>
            <Pencil className="h-4 w-4" />
            Edit application
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={application.stage} />
          <Badge tone="outline">{application.workMode}</Badge>
          {application.expectedCtc ? <Badge tone="info">Target {application.expectedCtc}</Badge> : null}
          {application.offeredCtc ? <Badge tone="success">Offer {application.offeredCtc}</Badge> : null}
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-2xs font-medium text-accent hover:underline"
            >
              Website
              <ArrowUpRight className="h-3 w-3" />
            </a>
          ) : null}
        </div>

        {followUpOverdue ? (
          <div className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-xs text-danger">
            Follow-up was due {formatDate(application.followUpDate, 'd MMM yyyy')}. Reach out to keep the
            conversation moving.
          </div>
        ) : nextInterviewSoon ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
            Next conversation on {formatDate(application.nextInterviewDate, 'd MMM yyyy')} · {application.stage}
          </div>
        ) : null}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
          <DetailItem label="Applied on" value={formatDate(application.applicationDate)} />
          <DetailItem label="Next interview" value={formatDate(application.nextInterviewDate)} />
          <DetailItem label="Follow-up" value={formatDate(application.followUpDate)} />
          <DetailItem label="Referral" value={application.referralSource} />
          <DetailItem label="Recruiter" value={application.recruiterName} />
          <DetailItem label="Contact" value={application.recruiterContact} />
          <DetailItem label="Created" value={formatDateTime(application.createdAt)} />
          <DetailItem label="Last updated" value={relativeTime(application.updatedAt)} />
        </dl>

        {application.jobDescription ? (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold">Job description</h3>
            <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-lg border border-border bg-card px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              {application.jobDescription}
            </p>
          </section>
        ) : null}

        {application.notes ? (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold">Notes</h3>
            <p className="whitespace-pre-line rounded-lg border border-border bg-card px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              {application.notes}
            </p>
          </section>
        ) : null}

        <section className="rounded-lg border border-border p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold">
            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
            Move to another stage
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="New stage" htmlFor="detail-stage">
              <Select
                id="detail-stage"
                value={pendingStage}
                onChange={(event) => setPendingStage(event.target.value as ApplicationStage)}
              >
                {APPLICATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Note" htmlFor="detail-stage-note" hint="Added to the stage history">
              <Input
                id="detail-stage-note"
                value={stageNote}
                onChange={(event) => setStageNote(event.target.value)}
                placeholder="e.g. Cleared recruiter screen"
              />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={changeStage}
              disabled={pendingStage === application.stage}
            >
              Update stage
            </Button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            Stage history
          </h3>
          <ol className="space-y-3 border-l border-border pl-4">
            {[...application.history].reverse().map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full border-2 border-card bg-accent" />
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-medium">{entry.to}</span>
                  {entry.from ? (
                    <span className="text-muted-foreground">from {entry.from}</span>
                  ) : null}
                  <span className="text-2xs text-muted-foreground">· {formatDateTime(entry.date)}</span>
                </div>
                {entry.note ? (
                  <p className="mt-0.5 text-2xs text-muted-foreground">{entry.note}</p>
                ) : null}
              </li>
            ))}
            {!application.history.length ? (
              <li className="text-xs text-muted-foreground">No stage changes recorded yet.</li>
            ) : null}
          </ol>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-2xs text-muted-foreground">
          {application.recruiterName ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3 w-3" />
              {application.recruiterName}
            </span>
          ) : null}
          {application.recruiterContact ? (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {application.recruiterContact}
            </span>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
