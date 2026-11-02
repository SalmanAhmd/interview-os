import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { TechTopic, TopicStatus } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select, Textarea } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { joinLines, splitLines } from '../../lib/utils';

const statuses: TopicStatus[] = ['Not Started', 'Learning', 'Practiced', 'Confident', 'Mastered'];

const topicSchema = z.object({
  name: z.string().trim().min(2, 'Add a topic name.'),
  status: z.enum(['Not Started', 'Learning', 'Practiced', 'Confident', 'Mastered']),
  confidence: z.number().int().min(1, 'Rate confidence from 1 to 5.').max(5),
  revisionDate: z.string(),
  notes: z.string(),
  questions: z.string(),
  exercises: z.string(),
});

type TopicFormValues = z.infer<typeof topicSchema>;

function toDefaults(topic: TechTopic | null): TopicFormValues {
  return {
    name: topic?.name ?? '',
    status: topic?.status ?? 'Not Started',
    confidence: topic?.confidence ?? 1,
    revisionDate: topic?.revisionDate ?? '',
    notes: topic?.notes ?? '',
    questions: joinLines(topic?.questions ?? []),
    exercises: joinLines(topic?.exercises ?? []),
  };
}

export function TopicFormDialog({
  open,
  onClose,
  categoryId,
  categoryName,
  topic,
}: {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  topic: TechTopic | null;
}) {
  const addTopic = useAppStore((state) => state.addTopic);
  const updateTopic = useAppStore((state) => state.updateTopic);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: toDefaults(topic),
  });

  useEffect(() => {
    if (open) reset(toDefaults(topic));
  }, [open, topic, reset]);

  const onSubmit = (values: TopicFormValues) => {
    const payload = {
      name: values.name.trim(),
      status: values.status,
      confidence: values.confidence,
      revisionDate: values.revisionDate,
      notes: values.notes,
      questions: splitLines(values.questions),
      exercises: splitLines(values.exercises),
    };
    if (topic) {
      updateTopic(categoryId, topic.id, payload);
      success('Topic updated', { description: values.name });
    } else {
      addTopic(categoryId, payload);
      success('Topic added', { description: `${values.name} · ${categoryName}` });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={topic ? 'Edit technical topic' : 'Add technical topic'}
      description={`${categoryName} · track status, confidence and revision notes`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="topic-form">
            <Save className="h-4 w-4" />
            {topic ? 'Save topic' : 'Add topic'}
          </Button>
        </>
      }
    >
      <form id="topic-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormGrid>
          <Field label="Topic name" htmlFor="topic-name" error={errors.name?.message} required>
            <Input
              id="topic-name"
              data-autofocus
              {...register('name')}
              placeholder="e.g. Event loop"
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field label="Learning status" htmlFor="topic-status">
            <Select id="topic-status" {...register('status')}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Confidence"
            htmlFor="topic-confidence"
            error={errors.confidence?.message}
            hint="1 = no confidence, 5 = interview ready"
          >
            <Select
              id="topic-confidence"
              {...register('confidence', { valueAsNumber: true })}
              aria-invalid={!!errors.confidence}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Next revision date" htmlFor="topic-revision" hint="Optional">
            <Input id="topic-revision" type="date" {...register('revisionDate')} />
          </Field>
        </FormGrid>

        <Field label="Notes" htmlFor="topic-notes" hint="Key ideas, interview traps, examples from your experience">
          <Textarea id="topic-notes" rows={5} {...register('notes')} placeholder="Write your own explanation…" />
        </Field>

        <FormGrid>
          <Field label="Related interview questions" htmlFor="topic-questions" hint="One question per line">
            <Textarea id="topic-questions" rows={5} {...register('questions')} />
          </Field>
          <Field label="Practice exercises" htmlFor="topic-exercises" hint="One exercise per line">
            <Textarea id="topic-exercises" rows={5} {...register('exercises')} />
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
