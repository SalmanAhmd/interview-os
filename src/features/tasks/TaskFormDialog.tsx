import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { Task } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select, Textarea } from '../../components/ui/input';

const taskSchema = z.object({
  title: z.string().trim().min(2, 'Add a task title.'),
  description: z.string(),
  dueDate: z.string(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  status: z.enum(['Todo', 'In Progress', 'Done']),
  category: z.string(),
  relatedWeekId: z.string(),
  relatedTopicId: z.string(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const TASK_CATEGORIES = ['Preparation', 'Applications', 'Interview', 'Revision', 'Portfolio', 'Admin', 'Personal'];

function toDefaults(task: Task | null): TaskFormValues {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    dueDate: task?.dueDate ?? '',
    priority: task?.priority ?? 'Medium',
    status: task?.status ?? 'Todo',
    category: task?.category ?? 'Preparation',
    relatedWeekId: task?.relatedWeekId ?? '',
    relatedTopicId: task?.relatedTopicId ?? '',
  };
}

export function TaskFormDialog({
  open,
  onClose,
  task,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
}) {
  const roadmap = useAppStore((state) => state.data.roadmap);
  const categories = useAppStore((state) => state.data.techCategories);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: toDefaults(task),
  });

  useEffect(() => {
    if (open) reset(toDefaults(task));
  }, [open, task, reset]);

  const onSubmit = (values: TaskFormValues) => {
    const payload = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category.trim() || 'General',
    };
    if (task) {
      updateTask(task.id, payload);
      success('Task updated', { description: values.title });
    } else {
      addTask(payload);
      success('Task added', { description: values.title });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'Add task'}
      description="Keep the next action small, specific and tied to a week or topic when relevant."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            {task ? 'Save task' : 'Add task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Task" htmlFor="task-title" error={errors.title?.message} required>
          <Input
            id="task-title"
            data-autofocus
            {...register('title')}
            placeholder="e.g. Finish React reconciliation notes"
            aria-invalid={!!errors.title}
          />
        </Field>

        <Field label="Description" htmlFor="task-description">
          <Textarea id="task-description" rows={2} {...register('description')} />
        </Field>

        <FormGrid>
          <Field label="Due date" htmlFor="task-due">
            <Input id="task-due" type="date" {...register('dueDate')} />
          </Field>
          <Field label="Priority" htmlFor="task-priority">
            <Select id="task-priority" {...register('priority')}>
              {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="task-status">
            <Select id="task-status" {...register('status')}>
              {['Todo', 'In Progress', 'Done'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" htmlFor="task-category">
            <Input id="task-category" list="task-category-options" {...register('category')} />
            <datalist id="task-category-options">
              {TASK_CATEGORIES.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </Field>
          <Field label="Related week" htmlFor="task-week" hint="Optional">
            <Select id="task-week" {...register('relatedWeekId')}>
              <option value="">No linked week</option>
              {roadmap.map((week) => (
                <option key={week.id} value={week.id}>
                  Week {week.number} · {week.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Related topic" htmlFor="task-topic" hint="Optional">
            <Select id="task-topic" {...register('relatedTopicId')}>
              <option value="">No linked topic</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {category.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
