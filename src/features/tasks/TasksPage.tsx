import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Flag,
  ListChecks,
  Pencil,
  Plus,
  SearchX,
  Target,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { Goal, Task, TaskPriority, TaskStatus } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput } from '../../components/common/SearchInput';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { EmptyState } from '../../components/ui/empty-state';
import { Progress } from '../../components/ui/progress';
import { ConfirmDialog } from '../../components/ui/dialog';
import { Checkbox, Select } from '../../components/ui/input';
import { formatDate, isPastDate, isToday } from '../../lib/dates';
import { average, percent } from '../../lib/utils';
import { TaskFormDialog } from './TaskFormDialog';
import { GoalFormDialog } from './GoalFormDialog';

type TabValue = 'tasks' | 'goals';
type SortMode = 'due' | 'priority' | 'updated';

const PRIORITY_ORDER: Record<TaskPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

export default function TasksPage({ initialTab = 'tasks' }: { initialTab?: TabValue }) {
  const data = useAppStore((state) => state.data);
  const toggleTaskStatus = useAppStore((state) => state.toggleTaskStatus);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const toggleMilestone = useAppStore((state) => state.toggleMilestone);
  const deleteGoal = useAppStore((state) => state.deleteGoal);
  const { success } = useToast();

  const [tab, setTab] = useState<TabValue>(initialTab);
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'All'>('All');
  const [sort, setSort] = useState<SortMode>('due');
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const tasks = data.tasks;
  const goals = data.goals;
  const openTasks = tasks.filter((task) => task.status !== 'Done').length;
  const doneTasks = tasks.filter((task) => task.status === 'Done').length;
  const dueSoon = tasks.filter(
    (task) => task.status !== 'Done' && task.dueDate && task.dueDate <= new Date().toISOString().slice(0, 10),
  ).length;
  const goalAverage = average(goals.map((goal) => goal.progress));

  const filteredTasks = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();
    const rows = tasks.filter((task) => {
      if (statusFilter !== 'All' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;
      if (!query) return true;
      return [task.title, task.description, task.category].join(' ').toLowerCase().includes(query);
    });
    return [...rows].sort((a, b) => {
      if (sort === 'priority') {
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority] || a.title.localeCompare(b.title);
      }
      if (sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, taskSearch, statusFilter, priorityFilter, sort]);

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
    [goals],
  );

  const statusTabs = [
    { value: 'All', label: 'All', count: tasks.length },
    ...(['Todo', 'In Progress', 'Done'] as TaskStatus[]).map((status) => ({
      value: status,
      label: status,
      count: tasks.filter((task) => task.status === status).length,
    })),
  ];

  const allTopics = data.techCategories.flatMap((category) => category.topics);

  const openAdd = () => {
    if (tab === 'tasks') {
      setEditingTask(null);
      setTaskFormOpen(true);
    } else {
      setEditingGoal(null);
      setGoalFormOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tab === 'tasks' ? 'Execution system' : 'Outcome system'}
        title="Tasks & goals"
        description={
          tab === 'tasks'
            ? 'Small, specific actions with due dates and priority. Link tasks to preparation weeks or topics to stay aligned.'
            : 'Longer-term outcomes and milestones. Progress updates as milestones are completed.'
        }
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            {tab === 'tasks' ? 'Add task' : 'Add goal'}
          </Button>
        }
      />

      <Tabs
        items={[
          { value: 'tasks', label: 'Tasks', count: tasks.length, icon: <ListChecks className="h-3.5 w-3.5" /> },
          { value: 'goals', label: 'Goals & milestones', count: goals.length, icon: <Target className="h-3.5 w-3.5" /> },
        ]}
        value={tab}
        onChange={(value) => setTab(value as TabValue)}
        ariaLabel="Tasks and goals sections"
      />

      {tab === 'tasks' ? (
        <>
          <section aria-label="Task summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Open tasks" value={openTasks} hint={`${tasks.length} total tasks`} icon={ListChecks} />
            <StatCard label="Due / overdue" value={dueSoon} hint="Open tasks with a due date on or before today" icon={CalendarClock} />
            <StatCard label="Completed" value={doneTasks} hint={`${percent(doneTasks, tasks.length)}% completion`} icon={CheckCircle2} />
            <StatCard label="Urgent or high" value={tasks.filter((task) => task.status !== 'Done' && ['Urgent', 'High'].includes(task.priority)).length} hint="Open high-priority actions" icon={TriangleAlert} />
          </section>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Tabs items={statusTabs} value={statusFilter} onChange={(value) => setStatusFilter(value as TaskStatus | 'All')} ariaLabel="Filter tasks by status" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput value={taskSearch} onChange={setTaskSearch} placeholder="Search tasks…" ariaLabel="Search tasks" className="w-full sm:w-56" />
              <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | 'All')} className="sm:w-36" aria-label="Filter tasks by priority">
                <option value="All">All priorities</option>
                {(['Urgent', 'High', 'Medium', 'Low'] as TaskPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
              <Select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="sm:w-36" aria-label="Sort tasks">
                <option value="due">By due date</option>
                <option value="priority">By priority</option>
                <option value="updated">Recently updated</option>
              </Select>
            </div>
          </div>

          {filteredTasks.length ? (
            <Card>
              <ul className="divide-y divide-border">
                {filteredTasks.map((task) => {
                  const week = data.roadmap.find((item) => item.id === task.relatedWeekId);
                  const topic = allTopics.find((item) => item.id === task.relatedTopicId);
                  const overdue = task.status !== 'Done' && isPastDate(task.dueDate);
                  const dueToday = task.status !== 'Done' && isToday(task.dueDate);
                  return (
                    <li key={task.id} className="group flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <Checkbox
                          checked={task.status === 'Done'}
                          onChange={() => {
                            toggleTaskStatus(task.id);
                            success(task.status === 'Done' ? 'Task reopened' : 'Task completed', { description: task.title });
                          }}
                          aria-label={`Mark ${task.title} as ${task.status === 'Done' ? 'not done' : 'done'}`}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-medium ${task.status === 'Done' ? 'text-muted-foreground line-through' : ''}`}>
                            {task.title}
                          </p>
                          {task.description ? (
                            <p className="mt-0.5 line-clamp-1 text-2xs text-muted-foreground">{task.description}</p>
                          ) : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Badge tone={task.priority === 'Urgent' ? 'danger' : task.priority === 'High' ? 'warning' : 'neutral'}>
                              {task.priority}
                            </Badge>
                            <Badge tone="outline">{task.category}</Badge>
                            {task.dueDate ? (
                              <span className={`text-2xs ${overdue ? 'font-medium text-danger' : dueToday ? 'font-medium text-warning' : 'text-muted-foreground'}`}>
                                {overdue ? 'Overdue · ' : dueToday ? 'Due today · ' : 'Due '}
                                {formatDate(task.dueDate, 'd MMM')}
                              </span>
                            ) : (
                              <span className="text-2xs text-muted-foreground">No due date</span>
                            )}
                            {week ? (
                              <span className="text-2xs text-muted-foreground">· Week {week.number}</span>
                            ) : null}
                            {topic ? (
                              <span className="text-2xs text-muted-foreground">· {topic.name}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          value={task.status}
                          onChange={(event) => updateTask(task.id, { status: event.target.value as TaskStatus })}
                          className="h-8 w-32 text-2xs"
                          aria-label={`Status for ${task.title}`}
                        >
                          {(['Todo', 'In Progress', 'Done'] as TaskStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingTask(task);
                            setTaskFormOpen(true);
                          }}
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setTaskToDelete(task)} aria-label={`Delete ${task.title}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : (
            <EmptyState
              icon={taskSearch || statusFilter !== 'All' || priorityFilter !== 'All' ? SearchX : ListChecks}
              title={taskSearch || statusFilter !== 'All' || priorityFilter !== 'All' ? 'No tasks match' : 'No tasks yet'}
              description={
                taskSearch || statusFilter !== 'All' || priorityFilter !== 'All'
                  ? 'Clear the filters or try a different search term.'
                  : 'Add the next concrete action. Tasks keep the 22-week plan moving one step at a time.'
              }
              action={
                taskSearch || statusFilter !== 'All' || priorityFilter !== 'All' ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTaskSearch('');
                      setStatusFilter('All');
                      setPriorityFilter('All');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={openAdd}>
                    <Plus className="h-4 w-4" />
                    Add task
                  </Button>
                )
              }
            />
          )}
        </>
      ) : (
        <>
          <section aria-label="Goal summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Goals" value={goals.length} hint="Long-term outcomes" icon={Target} />
            <StatCard label="In progress" value={goals.filter((goal) => goal.status === 'In Progress').length} hint="Currently being worked on" icon={Flag} />
            <StatCard label="Completed" value={goals.filter((goal) => goal.status === 'Completed').length} hint={`${percent(goals.filter((goal) => goal.status === 'Completed').length, goals.length)}% of goals`} icon={CheckCircle2} />
            <StatCard label="Average progress" value={`${Math.round(goalAverage)}%`} hint="Across all goals and milestones" icon={ListChecks} />
          </section>

          {sortedGoals.length ? (
            <section aria-label="Goals" className="grid gap-4 lg:grid-cols-2">
              {sortedGoals.map((goal) => {
                const completedMilestones = goal.milestones.filter((milestone) => milestone.done).length;
                const overdue = goal.status !== 'Completed' && isPastDate(goal.targetDate);
                return (
                  <Card key={goal.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold">{goal.title}</h2>
                          <StatusBadge status={goal.status} />
                        </div>
                        <p className={`mt-1 text-2xs ${overdue ? 'font-medium text-danger' : 'text-muted-foreground'}`}>
                          Target {formatDate(goal.targetDate, 'd MMM yyyy')}
                          {overdue ? ' · past due' : ''} · {completedMilestones}/{goal.milestones.length} milestones
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingGoal(goal);
                            setGoalFormOpen(true);
                          }}
                          aria-label={`Edit ${goal.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setGoalToDelete(goal)} aria-label={`Delete ${goal.title}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {goal.description ? (
                      <p className="mt-2 line-clamp-2 text-2xs leading-4 text-muted-foreground">{goal.description}</p>
                    ) : null}

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-2xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium tabular-nums">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="mt-1" />
                    </div>

                    {goal.milestones.length ? (
                      <ul className="mt-3 space-y-1.5">
                        {goal.milestones.map((milestone) => (
                          <li key={milestone.id} className="flex items-start gap-2">
                            <Checkbox
                              checked={milestone.done}
                              onChange={() => toggleMilestone(goal.id, milestone.id)}
                              aria-label={`Mark ${milestone.title} as ${milestone.done ? 'not done' : 'done'}`}
                              className="mt-0.5"
                            />
                            <span className={`text-2xs leading-4 ${milestone.done ? 'text-muted-foreground line-through' : ''}`}>
                              {milestone.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-2xs text-muted-foreground">No milestones yet — edit this goal to add some.</p>
                    )}
                  </Card>
                );
              })}
            </section>
          ) : (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Set a longer-term outcome, break it into milestones and let progress update as you tick them off."
              action={
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Add goal
                </Button>
              }
            />
          )}
        </>
      )}

      <TaskFormDialog open={taskFormOpen} onClose={() => setTaskFormOpen(false)} task={editingTask} />
      <GoalFormDialog open={goalFormOpen} onClose={() => setGoalFormOpen(false)} goal={editingGoal} />
      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete this task?"
        description={`"${taskToDelete?.title ?? 'This task'}" will be removed. This cannot be undone.`}
        confirmLabel="Delete task"
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete.id);
            success('Task deleted', { description: taskToDelete.title });
          }
          setTaskToDelete(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(goalToDelete)}
        title="Delete this goal?"
        description={`"${goalToDelete?.title ?? 'This goal'}" and all of its milestones will be removed. This cannot be undone.`}
        confirmLabel="Delete goal"
        onCancel={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) {
            deleteGoal(goalToDelete.id);
            success('Goal deleted', { description: goalToDelete.title });
          }
          setGoalToDelete(null);
        }}
      />
    </div>
  );
}
