import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { ActivityCategory, TimetableSlot } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { formatDuration } from '../../lib/utils';
import { minutesBetween } from '../../lib/dates';

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'Technical Concepts',
  'Hands-on Coding',
  'Interview Communication',
  'System Design',
  'Mock Interview',
  'Review & Applications',
  'DSA / Machine Coding',
  'Weak-area Revision',
  'Planning',
  'Custom',
];

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotSchema = z
  .object({
    title: z.string().trim().min(2, 'Add a title with at least 2 characters.'),
    dayOfWeek: z.number().int().min(1).max(7),
    category: z.enum([
      'Technical Concepts',
      'Hands-on Coding',
      'Interview Communication',
      'System Design',
      'Mock Interview',
      'Review & Applications',
      'DSA / Machine Coding',
      'Weak-area Revision',
      'Planning',
      'Custom',
    ]),
    startTime: z.string().regex(timePattern, 'Use a valid start time.'),
    endTime: z.string().regex(timePattern, 'Use a valid end time.'),
  })
  .refine((values) => minutesBetween(values.startTime, values.endTime) > 0, {
    message: 'End time must be after start time.',
    path: ['endTime'],
  });

type SlotFormValues = z.infer<typeof slotSchema>;

function defaults(day: number, slot: TimetableSlot | null): SlotFormValues {
  return {
    title: slot?.title ?? '',
    dayOfWeek: slot?.dayOfWeek ?? day,
    category: slot?.category ?? 'Technical Concepts',
    startTime: slot?.startTime ?? '20:00',
    endTime: slot?.endTime ?? '20:45',
  };
}

export function SlotFormDialog({
  open,
  onClose,
  slot,
  defaultDay,
}: {
  open: boolean;
  onClose: () => void;
  slot: TimetableSlot | null;
  defaultDay: number;
}) {
  const addSlot = useAppStore((state) => state.addSlot);
  const updateSlot = useAppStore((state) => state.updateSlot);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: defaults(defaultDay, slot),
  });

  useEffect(() => {
    if (open) reset(defaults(defaultDay, slot));
  }, [open, defaultDay, slot, reset]);

  const start = watch('startTime');
  const end = watch('endTime');
  const duration = minutesBetween(start, end);

  const onSubmit = (values: SlotFormValues) => {
    const payload = {
      ...values,
      title: values.title.trim(),
      durationMinutes: minutesBetween(values.startTime, values.endTime),
    };
    if (slot) {
      updateSlot(slot.id, payload);
      success('Activity updated', { description: values.title });
    } else {
      addSlot(payload);
      success('Activity added', { description: `${values.title} on ${DAYS[values.dayOfWeek - 1].label}` });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={slot ? 'Edit study activity' : 'Add study activity'}
      description="Recurring weekly activity. Completion is tracked per calendar date."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="slot-form">
            <Save className="h-4 w-4" />
            {slot ? 'Save changes' : 'Add activity'}
          </Button>
        </>
      }
    >
      <form id="slot-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Activity title" htmlFor="slot-title" error={errors.title?.message} required>
          <Input
            id="slot-title"
            data-autofocus
            {...register('title')}
            placeholder="e.g. React performance deep dive"
            aria-invalid={!!errors.title}
          />
        </Field>

        <FormGrid>
          <Field label="Day" htmlFor="slot-day" error={errors.dayOfWeek?.message}>
            <Select id="slot-day" {...register('dayOfWeek', { valueAsNumber: true })}>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" htmlFor="slot-category" error={errors.category?.message}>
            <Select id="slot-category" {...register('category')}>
              {ACTIVITY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start time" htmlFor="slot-start" error={errors.startTime?.message} required>
            <Input id="slot-start" type="time" {...register('startTime')} aria-invalid={!!errors.startTime} />
          </Field>
          <Field label="End time" htmlFor="slot-end" error={errors.endTime?.message} required>
            <Input id="slot-end" type="time" {...register('endTime')} aria-invalid={!!errors.endTime} />
          </Field>
        </FormGrid>

        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Planned duration</span>
          <span className="font-medium tabular-nums">{formatDuration(Math.max(0, duration))}</span>
        </div>
        <p className="text-2xs leading-4 text-muted-foreground">
          Need to reschedule? Change the day or times here. To skip a single occurrence, use the skip action on
          that date in the timetable.
        </p>
      </form>
    </Dialog>
  );
}
