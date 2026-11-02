import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { InterviewRecord } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select, Textarea } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { todayISO } from '../../lib/dates';

const interviewSchema = z.object({
  applicationId: z.string(),
  company: z.string().trim().min(2, 'Add the company name.'),
  date: z.string().min(1, 'Add the interview date.'),
  round: z.string().trim().min(2, 'Add the interview round.'),
  interviewerName: z.string(),
  result: z.enum(['Pending', 'Passed', 'Failed', 'Offer', 'No Show']),
  nextRoundDate: z.string(),
  topics: z.string(),
  questions: z.string(),
  wentWell: z.string(),
  struggled: z.string(),
  technicalMistakes: z.string(),
  communicationFeedback: z.string(),
  improvementActions: z.string(),
});

type InterviewFormValues = z.infer<typeof interviewSchema>;

function toDefaults(interview: InterviewRecord | null): InterviewFormValues {
  return {
    applicationId: interview?.applicationId ?? '',
    company: interview?.company ?? '',
    date: interview?.date ?? todayISO(),
    round: interview?.round ?? 'Technical Round',
    interviewerName: interview?.interviewerName ?? '',
    result: interview?.result ?? 'Pending',
    nextRoundDate: interview?.nextRoundDate ?? '',
    topics: interview?.topics.join(', ') ?? '',
    questions: interview?.questions ?? '',
    wentWell: interview?.wentWell ?? '',
    struggled: interview?.struggled ?? '',
    technicalMistakes: interview?.technicalMistakes ?? '',
    communicationFeedback: interview?.communicationFeedback ?? '',
    improvementActions: interview?.improvementActions ?? '',
  };
}

export function InterviewFormDialog({
  open,
  onClose,
  interview,
}: {
  open: boolean;
  onClose: () => void;
  interview: InterviewRecord | null;
}) {
  const applications = useAppStore((state) => state.data.applications);
  const addInterview = useAppStore((state) => state.addInterview);
  const updateInterview = useAppStore((state) => state.updateInterview);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: toDefaults(interview),
  });

  useEffect(() => {
    if (open) reset(toDefaults(interview));
  }, [open, interview, reset]);

  const onSubmit = (values: InterviewFormValues) => {
    const payload = {
      applicationId: values.applicationId,
      company: values.company.trim(),
      date: values.date,
      round: values.round.trim(),
      interviewerName: values.interviewerName.trim(),
      result: values.result,
      nextRoundDate: values.nextRoundDate,
      topics: values.topics
        .split(',')
        .map((topic) => topic.trim())
        .filter(Boolean),
      questions: values.questions,
      wentWell: values.wentWell,
      struggled: values.struggled,
      technicalMistakes: values.technicalMistakes,
      communicationFeedback: values.communicationFeedback,
      improvementActions: values.improvementActions,
    };

    if (interview) {
      updateInterview(interview.id, payload);
      success('Interview updated', { description: `${values.company} · ${values.round}` });
    } else {
      addInterview(payload);
      success('Interview logged', { description: `${values.company} · ${values.round}` });
    }
    onClose();
  };

  const selectApplication = (id: string) => {
    setValue('applicationId', id);
    const application = applications.find((item) => item.id === id);
    if (application) {
      setValue('company', application.companyName);
      if (!getValues('round')) setValue('round', application.stage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={interview ? 'Edit interview record' : 'Log an interview'}
      description="Capture what was asked, how it went and the actions that will improve the next round."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="interview-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            {interview ? 'Save interview' : 'Log interview'}
          </Button>
        </>
      }
    >
      <form id="interview-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormGrid>
          <Field label="Linked application" htmlFor="int-application" hint="Optional — links company and role context">
            <Select
              id="int-application"
              {...register('applicationId')}
              onChange={(event) => selectApplication(event.target.value)}
            >
              <option value="">No linked application</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.companyName} · {application.role}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Company" htmlFor="int-company" error={errors.company?.message} required>
            <Input
              id="int-company"
              data-autofocus
              {...register('company')}
              placeholder="e.g. Razorpay"
              aria-invalid={!!errors.company}
            />
          </Field>
          <Field label="Interview date" htmlFor="int-date" error={errors.date?.message} required>
            <Input id="int-date" type="date" {...register('date')} aria-invalid={!!errors.date} />
          </Field>
          <Field label="Round" htmlFor="int-round" error={errors.round?.message} required>
            <Input id="int-round" {...register('round')} placeholder="e.g. Technical Round 1" aria-invalid={!!errors.round} />
          </Field>
          <Field label="Interviewer" htmlFor="int-interviewer">
            <Input id="int-interviewer" {...register('interviewerName')} placeholder="Name or panel" />
          </Field>
          <Field label="Result" htmlFor="int-result">
            <Select id="int-result" {...register('result')}>
              {['Pending', 'Passed', 'Failed', 'Offer', 'No Show'].map((result) => (
                <option key={result} value={result}>
                  {result}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Next round date" htmlFor="int-next-round" hint="Optional">
            <Input id="int-next-round" type="date" {...register('nextRoundDate')} />
          </Field>
          <Field label="Topics" htmlFor="int-topics" hint="Comma separated">
            <Input id="int-topics" {...register('topics')} placeholder="React, closure, system design…" />
          </Field>
        </FormGrid>

        <Field label="Questions asked" htmlFor="int-questions" hint="One per line works best">
          <Textarea id="int-questions" rows={4} {...register('questions')} />
        </Field>

        <FormGrid>
          <Field label="What went well" htmlFor="int-went-well">
            <Textarea id="int-went-well" rows={4} {...register('wentWell')} />
          </Field>
          <Field label="What was difficult" htmlFor="int-struggled">
            <Textarea id="int-struggled" rows={4} {...register('struggled')} />
          </Field>
          <Field label="Technical mistakes" htmlFor="int-mistakes">
            <Textarea id="int-mistakes" rows={4} {...register('technicalMistakes')} />
          </Field>
          <Field label="Communication feedback" htmlFor="int-communication">
            <Textarea id="int-communication" rows={4} {...register('communicationFeedback')} />
          </Field>
        </FormGrid>

        <Field label="Improvement actions" htmlFor="int-actions" hint="Concrete next steps for the following round">
          <Textarea id="int-actions" rows={3} {...register('improvementActions')} />
        </Field>
      </form>
    </Dialog>
  );
}
