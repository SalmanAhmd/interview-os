import { useMemo, useState } from 'react';
import {
  Atom,
  Binary,
  BookOpenCheck,
  Code2,
  FileType2,
  Globe2,
  HelpCircle,
  Network,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { TechCategory, TechTopic, TopicStatus } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput } from '../../components/common/SearchInput';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import { Progress } from '../../components/ui/progress';
import { Tabs } from '../../components/ui/tabs';
import { ConfirmDialog } from '../../components/ui/dialog';
import { average, percent } from '../../lib/utils';
import { formatDate, isPastDate, isToday } from '../../lib/dates';
import { TopicFormDialog } from './TopicFormDialog';

const categoryIcons: Record<string, typeof Code2> = {
  'cat-javascript': Code2,
  'cat-react': Atom,
  'cat-typescript': FileType2,
  'cat-system-design': Network,
  'cat-dsa': Binary,
  'cat-web': Globe2,
};

const TOPIC_STATUSES: TopicStatus[] = ['Not Started', 'Learning', 'Practiced', 'Confident', 'Mastered'];

function categoryScore(category: TechCategory): number {
  if (!category.topics.length) return 0;
  return Math.round((average(category.topics.map((topic) => topic.confidence)) / 5) * 100);
}

function ConfidenceControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={`Confidence ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className="group/conf rounded p-0.5"
          aria-label={`Set confidence to ${score}`}
          title={`${score} / 5`}
        >
          <span
            className={
              score <= value
                ? 'block h-2 w-3.5 rounded-sm bg-accent transition-colors group-hover/conf:bg-accent/80'
                : 'block h-2 w-3.5 rounded-sm bg-muted transition-colors group-hover/conf:bg-muted-foreground/30'
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function TechnicalPage() {
  const data = useAppStore((state) => state.data);
  const updateTopic = useAppStore((state) => state.updateTopic);
  const deleteTopic = useAppStore((state) => state.deleteTopic);
  const { success } = useToast();
  const [selectedId, setSelectedId] = useState(data.techCategories[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'All'>('All');
  const [dialog, setDialog] = useState<{ open: boolean; topic: TechTopic | null }>({
    open: false,
    topic: null,
  });
  const [topicToDelete, setTopicToDelete] = useState<TechTopic | null>(null);

  const categories = data.techCategories;
  const selected = categories.find((category) => category.id === selectedId) ?? categories[0];
  const allTopics = categories.flatMap((category) => category.topics);
  const avgConfidence = average(allTopics.map((topic) => topic.confidence));
  const lowConfidence = allTopics.filter((topic) => topic.confidence <= 2).length;
  const interviewReady = allTopics.filter((topic) => topic.confidence >= 4).length;

  const tabs = useMemo(
    () =>
      [('All' as const), ...TOPIC_STATUSES].map((status) => ({
        value: status,
        label: status,
        count:
          status === 'All'
            ? selected?.topics.length ?? 0
            : selected?.topics.filter((topic) => topic.status === status).length ?? 0,
      })),
    [selected],
  );

  const filteredTopics = useMemo(() => {
    if (!selected) return [];
    const query = search.trim().toLowerCase();
    return selected.topics.filter((topic) => {
      const matchesStatus = statusFilter === 'All' || topic.status === statusFilter;
      const matchesSearch =
        !query ||
        topic.name.toLowerCase().includes(query) ||
        topic.notes.toLowerCase().includes(query) ||
        topic.questions.some((question) => question.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [selected, search, statusFilter]);

  const openAdd = () => setDialog({ open: true, topic: null });
  const openEdit = (topic: TechTopic) => setDialog({ open: true, topic });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Skill readiness"
        title="Technical preparation"
        description="Track every interview topic with a learning status, confidence rating, revision date and your own notes."
        actions={
          <Button onClick={openAdd} disabled={!selected}>
            <Plus className="h-4 w-4" />
            Add topic
          </Button>
        }
      />

      <section aria-label="Technical summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Average confidence"
          value={`${avgConfidence.toFixed(1)} / 5`}
          hint={`${percent(interviewReady, allTopics.length)}% of topics interview ready`}
          icon={BookOpenCheck}
        />
        <StatCard
          label="Topics tracked"
          value={allTopics.length}
          hint={`${categories.length} technical categories`}
          icon={Code2}
        />
        <StatCard
          label="Low confidence"
          value={lowConfidence}
          hint="Topics rated 1 or 2 out of 5"
          icon={TriangleAlert}
        />
        <StatCard
          label="Interview ready"
          value={interviewReady}
          hint="Topics rated 4 or 5 out of 5"
          icon={BookOpenCheck}
        />
      </section>

      <section aria-label="Skill categories" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = categoryIcons[category.id] ?? Code2;
          const score = categoryScore(category);
          const active = category.id === selected?.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedId(category.id);
                setSearch('');
                setStatusFilter('All');
              }}
              aria-pressed={active}
              className={
                active
                  ? 'rounded-xl border border-accent/40 bg-accent/[0.035] p-4 text-left shadow-xs transition-colors'
                  : 'rounded-xl border border-border bg-card p-4 text-left shadow-xs transition-colors hover:border-border/80 hover:bg-muted/20'
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{category.name}</p>
                    <p className="text-2xs text-muted-foreground">{category.topics.length} topics</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums">{score}%</span>
              </div>
              <Progress value={score} className="mt-3 h-1" />
              <p className="mt-2 line-clamp-1 text-2xs text-muted-foreground">{category.description}</p>
            </button>
          );
        })}
      </section>

      {selected ? (
        <Card>
          <div className="border-b border-border p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight">{selected.name}</h2>
                  <Badge tone="outline">{selected.topics.length} topics</Badge>
                  <Badge tone={categoryScore(selected) >= 60 ? 'success' : 'warning'}>
                    {categoryScore(selected)}% proficiency
                  </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  {selected.description}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" />
                Add topic
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              items={tabs}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as TopicStatus | 'All')}
              ariaLabel="Filter topics by status"
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${selected.name} topics…`}
              ariaLabel={`Search ${selected.name} topics`}
              className="w-full lg:w-64"
            />
          </div>

          <div className="border-t border-border">
            {filteredTopics.length ? (
              <ul className="divide-y divide-border">
                {filteredTopics.map((topic) => {
                  const revisionOverdue =
                    topic.revisionDate &&
                    isPastDate(topic.revisionDate) &&
                    topic.status !== 'Mastered';
                  const revisionToday = topic.revisionDate && isToday(topic.revisionDate);
                  return (
                    <li key={topic.id} className="group flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center">
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openEdit(topic)}
                          className="text-left text-xs font-medium text-foreground hover:text-accent"
                        >
                          {topic.name}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <HelpCircle className="h-2.5 w-2.5" />
                            {topic.questions.length} questions
                          </span>
                          <span>{topic.exercises.length} exercises</span>
                          {topic.revisionDate ? (
                            <span
                              className={
                                revisionOverdue
                                  ? 'font-medium text-danger'
                                  : revisionToday
                                    ? 'font-medium text-warning'
                                    : ''
                              }
                            >
                              {revisionOverdue ? 'Revision overdue · ' : revisionToday ? 'Revise today · ' : 'Revise '}
                              {formatDate(topic.revisionDate, 'd MMM')}
                            </span>
                          ) : (
                            <span>No revision date</span>
                          )}
                        </div>
                        {topic.notes ? (
                          <p className="mt-1 line-clamp-1 text-2xs text-muted-foreground/80">{topic.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <StatusBadge status={topic.status} />
                        <div className="flex items-center gap-2">
                          <span className="text-2xs text-muted-foreground">{topic.confidence}/5</span>
                          <ConfidenceControl
                            value={topic.confidence}
                            onChange={(value) => {
                              updateTopic(selected.id, topic.id, { confidence: value });
                              success('Confidence updated', { description: `${topic.name} · ${value}/5` });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(topic)}
                            aria-label={`Edit ${topic.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setTopicToDelete(topic)}
                            aria-label={`Delete ${topic.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={SearchX}
                title="No topics match this view"
                description="Try a different status or search term, or add a new topic for this category."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('All');
                    }}
                  >
                    Clear filters
                  </Button>
                }
                className="m-4"
              />
            )}
          </div>
        </Card>
      ) : null}

      {selected ? (
        <TopicFormDialog
          open={dialog.open}
          onClose={() => setDialog({ open: false, topic: null })}
          categoryId={selected.id}
          categoryName={selected.name}
          topic={dialog.topic}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(topicToDelete)}
        title="Delete this topic?"
        description={`"${topicToDelete?.name}" and its notes, questions and exercises will be removed from the technical tracker.`}
        confirmLabel="Delete topic"
        onCancel={() => setTopicToDelete(null)}
        onConfirm={() => {
          if (selected && topicToDelete) {
            deleteTopic(selected.id, topicToDelete.id);
            success('Topic deleted', { description: topicToDelete.name });
          }
          setTopicToDelete(null);
        }}
      />
    </div>
  );
}
