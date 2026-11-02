import { CalendarDays, Clock3, Pencil, Trash2 } from 'lucide-react';
import type { MockInterview } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { formatDate, formatDateTime } from '../../lib/dates';
import { formatDuration } from '../../lib/utils';

function MockSection({ title, content }: { title: string; content: string }) {
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

export function MockDetailDialog({
  mock,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  mock: MockInterview | null;
  open: boolean;
  onClose: () => void;
  onEdit: (mock: MockInterview) => void;
  onDelete: (mock: MockInterview) => void;
}) {
  if (!mock) return null;
  const tone = mock.score >= 7 ? 'success' : mock.score >= 5 ? 'warning' : 'danger';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${mock.type} mock interview`}
      description={`${formatDate(mock.date, 'EEEE, d MMM yyyy')} · ${formatDuration(mock.durationMinutes)}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onDelete(mock)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(mock)}>
            <Pencil className="h-4 w-4" />
            Edit mock
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-muted/15 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Score</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {mock.score.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground"> / 10</span>
              </p>
            </div>
            <Badge tone={tone} dot>
              {mock.score >= 7 ? 'Interview ready' : mock.score >= 5 ? 'Getting there' : 'Needs practice'}
            </Badge>
          </div>
          <Progress value={mock.score * 10} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">
            <CalendarDays className="h-3 w-3" />
            {formatDate(mock.date)}
          </Badge>
          <Badge tone="outline">
            <Clock3 className="h-3 w-3" />
            {formatDuration(mock.durationMinutes)}
          </Badge>
        </div>

        {mock.topics.length ? (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold">Topics covered</h3>
            <div className="flex flex-wrap gap-1.5">
              {mock.topics.map((topic) => (
                <Badge key={topic} tone="info">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <MockSection title="Strengths" content={mock.strengths} />
        <MockSection title="Weaknesses" content={mock.weaknesses} />
        <MockSection title="Interviewer feedback" content={mock.feedback} />
        <MockSection title="Action items" content={mock.actionItems} />

        <p className="border-t border-border pt-3 text-2xs text-muted-foreground">
          Last updated {formatDateTime(mock.updatedAt)}
        </p>
      </div>
    </Dialog>
  );
}
