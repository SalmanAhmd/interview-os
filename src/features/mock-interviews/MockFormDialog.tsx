import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { MockInterview } from '../../types';
import { MOCK_INTERVIEW_TYPES } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select, Textarea } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { todayISO } from '../../lib/dates';

const mockSchema = z.object({
  type: z.enum(MOCK_INTERVIEW_TYPES),
  date: z.string().min(1, 'Add the mock interview date.'),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes.').max(480, 'Keep duration realistic.'),
  score: z.number().min(0, 'Score must be between 0 and 10.').max(10, 'Score must be between 0 and 10.'),
  topics: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
  feedback: z.string(),
  actionItems: z.string(),
});

type MockFormValues = z.infer<typeof mockSchema>;

function toDefaults(mock: MockInterview | null): MockFormValues {
  return {
    type: mock?.type ?? 'React',
    date: mock?.date ?? todayISO(),
    durationMinutes: mock?.durationMinutes ?? 60,
    score: mock?.score ?? 7,
    topics: mock?.topics.join(', ') ?? '',
    strengths: mock?.strengths ?? '',
    weaknesses: mock?.weaknesses ?? '',
    feedback: mock?.feedback ?? '',
    actionItems: mock?.actionItems ?? '',
  };
}

export function MockFormDialog({
  open,
  onClose,
  mock,
}: {
  open: boolean;
  onClose: () => void;
  mock: MockInterview | null;
}) {
  const addMock = useAppStore((state) => state.addMock);
  const updateMock = useAppStore((state) => state.updateMock);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MockFormValues>({
    resolver: zodResolver(mockSchema),
    defaultValues: toDefaults(mock),
  });

  useEffect(() => {
    if (open) reset(toDefaults(mock));
  }, [open, mock, reset]);

  const score = watch('score');

  const onSubmit = (values: MockFormValues) => {
    const payload = {
      type: values.type,
      date: values.date,
      durationMinutes: values.durationMinutes,
      score: Number(values.score),
      topics: values.topics
        .split(',')
        .map((topic) => topic.trim())
        .filter(Boolean),
      strengths: values.strengths,
      weaknesses: values.weaknesses,
      feedback: values.feedback,
      actionItems: values.actionItems,
    };

    if (mock) {
      updateMock(mock.id, payload);
      success('Mock interview updated', { description: `${values.type} · ${values.score}/10` });
    } else {
      addMock(payload);
      success('Mock interview logged', { description: `${values.type} · ${values.score}/10` });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mock ? 'Edit mock interview' : 'Log a mock interview'}
      description="Record the score, strengths and one or two concrete actions to close the gaps."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="mock-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            {mock ? 'Save mock' : 'Log mock'}
          </Button>
        </>
      }
    >
      <form id="mock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormGrid>
          <Field label="Mock type" htmlFor="mock-type">
            <Select id="mock-type" data-autofocus {...register('type')}>
              {MOCK_INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="mock-date" error={errors.date?.message} required>
            <Input id="mock-date" type="date" {...register('date')} aria-invalid={!!errors.date} />
          </Field>
          <Field label="Duration (minutes)" htmlFor="mock-duration" error={errors.durationMinutes?.message}>
            <Input
              id="mock-duration"
              type="number"
              min={5}
              max={480}
              step={5}
              {...register('durationMinutes', { valueAsNumber: true })}
              aria-invalid={!!errors.durationMinutes}
            />
          </Field>
          <Field
            label="Score"
            htmlFor="mock-score"
            error={errors.score?.message}
            hint={`${Number.isFinite(score) ? score : 0}/10 · ${Number(score) >= 7 ? 'interview ready' : Number(score) >= 5 ? 'getting there' : 'needs focused practice'}`}
          >
            <Input
              id="mock-score"
              type="range"
              min={0}
              max={10}
              step={0.5}
              {...register('score', { valueAsNumber: true })}
              className="h-9 cursor-pointer border-0 bg-transparent px-0 shadow-none accent-[hsl(var(--accent))]"
              aria-invalid={!!errors.score}
            />
          </Field>
        </FormGrid>

        <Field label="Topics covered" htmlFor="mock-topics" hint="Comma separated">
          <Input id="mock-topics" {...register('topics')} placeholder="Reconciliation, useEffect, performance…" />
        </Field>

        <FormGrid>
          <Field label="Strengths" htmlFor="mock-strengths">
            <Textarea id="mock-strengths" rows={3} {...register('strengths')} />
          </Field>
          <Field label="Weaknesses" htmlFor="mock-weaknesses">
            <Textarea id="mock-weaknesses" rows={3} {...register('weaknesses')} />
          </Field>
        </FormGrid>

        <Field label="Interviewer feedback" htmlFor="mock-feedback">
          <Textarea id="mock-feedback" rows={3} {...register('feedback')} />
        </Field>
        <Field label="Action items" htmlFor="mock-actions" hint="One action per line works best">
          <Textarea id="mock-actions" rows={3} {...register('actionItems')} />
        </Field>
      </form>
    </Dialog>
  );
}
