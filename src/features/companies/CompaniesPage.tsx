import { useMemo, useState } from 'react';
import {
  Building2,
  Crown,
  ExternalLink,
  Flag,
  Pencil,
  Plus,
  SearchX,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import type { Company, CompanyCategory, Priority } from '../../types';
import { COMPANY_CATEGORIES, PRIORITIES } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput } from '../../components/common/SearchInput';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { Select } from '../../components/ui/input';
import { EmptyState } from '../../components/ui/empty-state';
import { ConfirmDialog } from '../../components/ui/dialog';
import { externalHref } from '../../lib/links';
import { CompanyFormDialog } from './CompanyFormDialog';
import { CompanyDetailDialog } from './CompanyDetailDialog';

type SortMode = 'priority' | 'name' | 'updated';

const PRIORITY_ORDER: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };

export default function CompaniesPage() {
  const data = useAppStore((state) => state.data);
  const deleteCompany = useAppStore((state) => state.deleteCompany);
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CompanyCategory | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [sort, setSort] = useState<SortMode>('priority');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [detail, setDetail] = useState<Company | null>(null);
  const [toDelete, setToDelete] = useState<Company | null>(null);

  const companies = data.companies;
  const dream = companies.filter((company) => company.category === 'Dream').length;
  const highPriority = companies.filter((company) => company.priority === 'High').length;
  const inProcess = companies.filter(
    (company) =>
      company.applicationStatus &&
      !/^(not started|none|no)$/i.test(company.applicationStatus.trim()),
  ).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = companies.filter((company) => {
      if (categoryFilter !== 'All' && company.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && company.priority !== priorityFilter) return false;
      if (!query) return true;
      return [company.name, company.industry, company.targetRoles.join(' '), company.techStack.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
    return [...rows].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
      return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] || a.name.localeCompare(b.name);
    });
  }, [companies, search, categoryFilter, priorityFilter, sort]);

  const tabs = [
    { value: 'All', label: 'All', count: companies.length },
    ...COMPANY_CATEGORIES.map((category) => ({
      value: category,
      label: category,
      count: companies.filter((company) => company.category === category).length,
    })),
  ];

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (company: Company) => {
    setDetail(null);
    setEditing(company);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Target intelligence"
        title="Company research"
        description="Understand the companies you want to work for: process, culture, tech stack, compensation and why they matter."
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add company
          </Button>
        }
      />

      <section aria-label="Company summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Companies tracked" value={companies.length} hint={`${inProcess} in process`} icon={Building2} />
        <StatCard label="Dream companies" value={dream} hint="Highest alignment with your goals" icon={Crown} />
        <StatCard label="High priority" value={highPriority} hint="Research and apply first" icon={Flag} />
        <StatCard label="Target companies" value={companies.filter((company) => company.category === 'Target').length} hint="Strong matches for the next move" icon={Target} />
      </section>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs items={tabs} value={categoryFilter} onChange={(value) => setCategoryFilter(value as CompanyCategory | 'All')} ariaLabel="Filter companies by category" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search companies, stack, roles…" ariaLabel="Search companies" className="w-full sm:w-64" />
          <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as Priority | 'All')} className="sm:w-36" aria-label="Filter companies by priority">
            <option value="All">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="sm:w-36" aria-label="Sort companies">
            <option value="priority">By priority</option>
            <option value="name">By name</option>
            <option value="updated">Recently updated</option>
          </Select>
        </div>
      </div>

      {filtered.length ? (
        <section aria-label="Company research cards" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company) => {
            const website = externalHref(company.website);
            return (
              <Card key={company.id} className="group flex flex-col p-4 transition-colors hover:border-border/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setDetail(company)}
                      className="text-left text-sm font-semibold hover:text-accent"
                    >
                      {company.name}
                    </button>
                    <p className="mt-0.5 text-2xs text-muted-foreground">
                      {company.industry || 'Industry not set'}
                      {company.salaryRange ? ` · ${company.salaryRange}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Open ${company.name} website`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(company)} aria-label={`Edit ${company.name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(company)} aria-label={`Delete ${company.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={company.category === 'Dream' ? 'success' : company.category === 'Target' ? 'info' : 'neutral'}>
                    {company.category}
                  </Badge>
                  <Badge tone={company.priority === 'High' ? 'danger' : company.priority === 'Medium' ? 'warning' : 'neutral'}>
                    {company.priority}
                  </Badge>
                  {company.applicationStatus ? <Badge tone="outline">{company.applicationStatus}</Badge> : null}
                </div>

                {company.targetRoles.length ? (
                  <div className="mt-3">
                    <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Target roles</p>
                    <p className="mt-0.5 line-clamp-2 text-2xs text-foreground">{company.targetRoles.join(' · ')}</p>
                  </div>
                ) : null}

                {company.techStack.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {company.techStack.slice(0, 5).map((tech) => (
                      <Badge key={tech} tone="neutral">
                        {tech}
                      </Badge>
                    ))}
                    {company.techStack.length > 5 ? <Badge tone="outline">+{company.techStack.length - 5}</Badge> : null}
                  </div>
                ) : null}

                {company.interviewProcess ? (
                  <p className="mt-3 line-clamp-2 text-2xs leading-4 text-muted-foreground">
                    <span className="font-medium text-foreground/80">Process:</span> {company.interviewProcess}
                  </p>
                ) : (
                  <p className="mt-3 text-2xs text-muted-foreground">No interview process notes yet.</p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <span className="text-2xs text-muted-foreground">
                    {company.reviewNotes ? 'Review notes added' : 'Research in progress'}
                  </span>
                  <Button variant="link" size="sm" onClick={() => setDetail(company)}>
                    View research
                  </Button>
                </div>
              </Card>
            );
          })}
        </section>
      ) : (
        <EmptyState
          icon={search || categoryFilter !== 'All' || priorityFilter !== 'All' ? SearchX : Sparkles}
          title={search || categoryFilter !== 'All' || priorityFilter !== 'All' ? 'No companies match' : 'No company research yet'}
          description={
            search || categoryFilter !== 'All' || priorityFilter !== 'All'
              ? 'Try a different category, priority or search term.'
              : 'Add dream and target companies, capture their process and tech stack, and walk into conversations prepared.'
          }
          action={
            search || categoryFilter !== 'All' || priorityFilter !== 'All' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('All');
                  setPriorityFilter('All');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add company
              </Button>
            )
          }
        />
      )}

      <CompanyFormDialog open={formOpen} onClose={() => setFormOpen(false)} company={editing} />
      <CompanyDetailDialog
        company={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={setToDelete}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this company?"
        description={`All research, process notes and culture notes for ${toDelete?.name ?? 'this company'} will be removed.`}
        confirmLabel="Delete company"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteCompany(toDelete.id);
            success('Company deleted', { description: toDelete.name });
          }
          setToDelete(null);
          setDetail(null);
        }}
      />
    </div>
  );
}
