import { Building2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { Company } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { formatDateTime } from '../../lib/dates';
import { externalHref } from '../../lib/links';

function Section({ title, content }: { title: string; content: string }) {
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

export function CompanyDetailDialog({
  company,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  company: Company | null;
  open: boolean;
  onClose: () => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}) {
  if (!company) return null;
  const website = externalHref(company.website);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={company.name}
      description={[company.industry, company.salaryRange].filter(Boolean).join(' · ')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onDelete(company)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit(company)}>
            <Pencil className="h-4 w-4" />
            Edit research
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={company.category === 'Dream' ? 'success' : company.category === 'Target' ? 'info' : 'neutral'}>
            {company.category}
          </Badge>
          <Badge tone={company.priority === 'High' ? 'danger' : company.priority === 'Medium' ? 'warning' : 'neutral'}>
            {company.priority} priority
          </Badge>
          {company.applicationStatus ? <Badge tone="outline">{company.applicationStatus}</Badge> : null}
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-2xs font-medium text-accent hover:underline"
            >
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/20 p-4 text-xs">
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Industry</dt>
            <dd className="mt-0.5">{company.industry || '—'}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Salary range</dt>
            <dd className="mt-0.5">{company.salaryRange || '—'}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Application status</dt>
            <dd className="mt-0.5">{company.applicationStatus || '—'}</dd>
          </div>
          <div>
            <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Last updated</dt>
            <dd className="mt-0.5">{formatDateTime(company.updatedAt)}</dd>
          </div>
        </dl>

        {company.targetRoles.length ? (
          <div>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              Target roles
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {company.targetRoles.map((role) => (
                <Badge key={role} tone="info">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {company.techStack.length ? (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold">Tech stack</h3>
            <div className="flex flex-wrap gap-1.5">
              {company.techStack.map((tech) => (
                <Badge key={tech} tone="neutral">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <Section title="Interview process" content={company.interviewProcess} />
        <Section title="Culture notes" content={company.cultureNotes} />
        <Section title="Review notes" content={company.reviewNotes} />
      </div>
    </Dialog>
  );
}
