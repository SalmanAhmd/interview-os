import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { Goal } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select, Textarea } from '../../components/ui/input';
import { createId, joinLines, splitLines } from '../../lib/utils';

const goalSchema = z.object({
  title: z.string().trim().min(3, 'Add a goal title.'),
  targetDate: z.string().min(1, 'Add a target date.'),
  description: z.string(),
  progress: z.number().int().min(0, 'Progress cannot be negative.').max(100, 'Progress cannot exceed 100%.'),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'At Risk']),
  milestones: z.string(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

function toDefaults(goal: Goal | null): GoalFormValues {
  return {
    title: goal?.title ?? '',
    targetDate: goal?.targetDate ?? '',
    description: goal?.description ?? '',
    progress: goal?.progress ?? 0,
    status: goal?.status ?? 'Not Started',
    milestones: joinLines(goal?.milestones.map((milestone) => milestone.title) ?? []),
  };
}

export function GoalFormDialog({
  open,
  onClose,
  goal,
}: {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
}) {
  const addGoal = useAppStore((state) => state.addGoal);
  const updateGoal = useAppStore((state) => state.updateGoal);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: toDefaults(goal),
  });

  useEffect(() => {
    if (open) reset(toDefaults(goal));
  }, [open, goal, reset]);

  const progressValue = watch('progress');

  const onSubmit = (values: GoalFormValues) => {
    const existing = goal?.milestones ?? [];
    const milestones = splitLines(values.milestones).map((title, index) => {
      const match =
        existing.find((milestone) => milestone.title === title) ?? existing[index];
      return {
        id: match?.id ?? createId('milestone'),
        title,
        done: match?.title === title ? match.done : false,
      };
    });
    const payload = {
      title: values.title.trim(),
      targetDate: values.targetDate,
      description: values.description.trim(),
      progress: values.progress,
      status: values.status,
      milestones,
    };

    if (goal) {
      updateGoal(goal.id, payload);
      success('Goal updated', { description: values.title });
    } else {
      addGoal(payload);
      success('Goal added', { description: values.title });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={goal ? 'Edit goal' : 'Add goal'}
      description="Milestones update progress automatically as you tick them off."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="goal-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            {goal ? 'Save goal' : 'Add goal'}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Goal" htmlFor="goal-title" error={errors.title?.message} required>
          <Input
            id="goal-title"
            data-autofocus
            {...register('title')}
            placeholder="e.g. Complete 10 mock interviews"
            aria-invalid={!!errors.title}
          />
        </Field>

        <FormGrid>
          <Field label="Target date" htmlFor="goal-date" error={errors.targetDate?.message} required>
            <Input id="goal-date" type="date" {...register('targetDate')} aria-invalid={!!errors.targetDate} />
          </Field>
          <Field label="Status" htmlFor="goal-status">
            <Select id="goal-status" {...register('status')}>
              {['Not Started', 'In Progress', 'Completed', 'At Risk'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>

        <Field label="Description" htmlFor="goal-description">
          <Textarea id="goal-description" rows={3} {...register('description')} />
        </Field>

        <Field label="Progress" htmlFor="goal-progress" error={errors.progress?.message} hint="0–100%. Also recalculated from milestones.">
          <div className="flex items-center gap-3">
            <Input
              id="goal-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              {...register('progress', { valueAsNumber: true })}
              className="h-9 flex-1 cursor-pointer border-0 bg-transparent px-0 shadow-none accent-[hsl(var(--accent))]"
            />
            <span className="w-10 text-right text-xs font-medium tabular-nums">
              {Number.isFinite(progressValue) ? progressValue : 0}%
            </span>
          </div>
        </Field>

        <Field label="Milestones" htmlFor="goal-milestones" hint="One milestone per line. Existing milestones keep their completion state.">
          <Textarea id="goal-milestones" rows={4} {...register('milestones')} placeholder={'Closures and scope\nEvent loop\nMock React interview'} />
        </Field>
      </form>
    </Dialog>
  );
}
