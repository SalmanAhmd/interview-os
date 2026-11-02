import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { RoadmapWeek } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Textarea } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { joinLines, splitLines } from '../../lib/utils';

const weekSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.'),
  technicalFocus: z.string().trim().min(1, 'Add at least one focus area.'),
  topics: z.string().trim().min(1, 'Add at least one topic.'),
  exercises: z.string(),
  mockObjectives: z.string(),
  jobSearch: z.string(),
  deliverables: z.string(),
  applicationTarget: z.number().int().min(0, 'Target cannot be negative.').max(100),
  notes: z.string(),
});

type WeekFormValues = z.infer<typeof weekSchema>;

function defaultsFor(week: RoadmapWeek): WeekFormValues {
  return {
    title: week.title,
    technicalFocus: joinLines(week.technicalFocus),
    topics: joinLines(week.topics),
    exercises: joinLines(week.exercises),
    mockObjectives: joinLines(week.mockObjectives),
    jobSearch: joinLines(week.jobSearch),
    deliverables: joinLines(week.deliverables),
    applicationTarget: week.applicationTarget,
    notes: week.notes,
  };
}

export function WeekEditDialog({
  week,
  open,
  onClose,
}: {
  week: RoadmapWeek | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateWeek = useAppStore((state) => state.updateWeek);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WeekFormValues>({
    resolver: zodResolver(weekSchema),
    defaultValues: week ? defaultsFor(week) : undefined,
  });

  useEffect(() => {
    if (week) reset(defaultsFor(week));
  }, [week, reset]);

  const onSubmit = (values: WeekFormValues) => {
    if (!week) return;
    updateWeek(week.id, {
      title: values.title.trim(),
      technicalFocus: splitLines(values.technicalFocus),
      topics: splitLines(values.topics),
      exercises: splitLines(values.exercises),
      mockObjectives: splitLines(values.mockObjectives),
      jobSearch: splitLines(values.jobSearch),
      deliverables: splitLines(values.deliverables),
      applicationTarget: values.applicationTarget,
      notes: values.notes,
    });
    success('Weekly plan updated', { description: `Week ${week.number} objectives saved.` });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={week ? `Edit Week ${week.number} plan` : 'Edit weekly plan'}
      description="Use one line per item. Changes save to this browser immediately."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="week-edit-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            Save plan
          </Button>
        </>
      }
    >
      {week ? (
        <form id="week-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGrid>
            <Field label="Week title" htmlFor="week-title" error={errors.title?.message} required>
              <Input id="week-title" data-autofocus {...register('title')} aria-invalid={!!errors.title} />
            </Field>
            <Field
              label="Application target"
              htmlFor="week-app-target"
              error={errors.applicationTarget?.message}
              hint="Number of applications to submit this week"
            >
              <Input
                id="week-app-target"
                type="number"
                min={0}
                max={100}
                {...register('applicationTarget', { valueAsNumber: true })}
                aria-invalid={!!errors.applicationTarget}
              />
            </Field>
          </FormGrid>

          <FormGrid>
            <Field
              label="Technical focus"
              htmlFor="week-focus"
              error={errors.technicalFocus?.message}
              hint="Short focus areas, one per line"
              required
            >
              <Textarea id="week-focus" rows={3} {...register('technicalFocus')} aria-invalid={!!errors.technicalFocus} />
            </Field>
            <Field label="Topics to study" htmlFor="week-topics" error={errors.topics?.message} required>
              <Textarea id="week-topics" rows={3} {...register('topics')} aria-invalid={!!errors.topics} />
            </Field>
            <Field label="Hands-on exercises" htmlFor="week-exercises">
              <Textarea id="week-exercises" rows={4} {...register('exercises')} />
            </Field>
            <Field label="Mock interview objectives" htmlFor="week-mocks">
              <Textarea id="week-mocks" rows={4} {...register('mockObjectives')} />
            </Field>
            <Field label="Job-search activities" htmlFor="week-job-search">
              <Textarea id="week-job-search" rows={4} {...register('jobSearch')} />
            </Field>
            <Field label="Expected deliverables" htmlFor="week-deliverables">
              <Textarea id="week-deliverables" rows={4} {...register('deliverables')} />
            </Field>
          </FormGrid>

          <Field label="Personal notes" htmlFor="week-notes">
            <Textarea id="week-notes" rows={4} {...register('notes')} placeholder="Reflections, blockers, adjustments…" />
          </Field>
        </form>
      ) : null}
    </Dialog>
  );
}
