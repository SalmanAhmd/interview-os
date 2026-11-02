import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ExternalLink,
  MessageSquareText,
  Pencil,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { InterviewRecord } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { useAppStore } from '../../stores/useAppStore';
import { formatDate, formatDateTime } from '../../lib/dates';

function FeedbackBlock({ title, content }: { title: string; content: string }) {
  if (!content.trim()) return null;
  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold">{title}</h3>
      <p className="whitespace-pre-line rounded-lg border border-border bg-muted/15 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        {content}
      </p>
    </section>
  );
}

export function InterviewDetailDialog({
  interview,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  interview: InterviewRecord | null;
  open: boolean;
  onClose: () => void;
  onEdit: (interview: InterviewRecord) => void;
  onDelete: (interview: InterviewRecord) => void;
}) {
  const applications = useAppStore((state) => state.data.applications);
  const application = interview
    ? applications.find((item) => item.id === interview.applicationId)
    : undefined;

  if (!interview) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${interview.company} · ${interview.round}`}
      description={`Interview logged on ${formatDate(interview.date, 'EEEE, d MMM yyyy')}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onDelete(interview)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(interview)}>
            <Pencil className="h-4 w-4" />
            Edit interview
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={interview.result} />
          <Badge tone="outline">
            <CalendarDays className="h-3 w-3" />
            {formatDate(interview.date)}
          </Badge>
          {interview.interviewerName ? (
            <Badge tone="neutral">
              <UserRound className="h-3 w-3" />
              {interview.interviewerName}
            </Badge>
          ) : null}
          {interview.nextRoundDate ? (
            <Badge tone="info">Next round {formatDate(interview.nextRoundDate)}</Badge>
          ) : null}
        </div>

        {application ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
            <span>
              Linked to <strong>{application.companyName}</strong> · {application.stage}
            </span>
            <Link to="/applications" className="inline-flex items-center gap-1 text-accent hover:underline">
              Open pipeline
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : null}

        {interview.topics.length ? (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold">Topics covered</h3>
            <div className="flex flex-wrap gap-1.5">
              {interview.topics.map((topic) => (
                <Badge key={topic} tone="info">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <section>
          <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
            Questions asked
          </h3>
          <p className="whitespace-pre-line rounded-lg border border-border bg-card px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            {interview.questions || 'No questions recorded.'}
          </p>
        </section>

        <FeedbackBlock title="What went well" content={interview.wentWell} />
        <FeedbackBlock title="What was difficult" content={interview.struggled} />
        <FeedbackBlock title="Technical mistakes" content={interview.technicalMistakes} />
        <FeedbackBlock title="Communication feedback" content={interview.communicationFeedback} />
        <FeedbackBlock title="Improvement actions" content={interview.improvementActions} />

        <p className="border-t border-border pt-3 text-2xs text-muted-foreground">
          Last updated {formatDateTime(interview.updatedAt)}
        </p>
      </div>
    </Dialog>
  );
}
