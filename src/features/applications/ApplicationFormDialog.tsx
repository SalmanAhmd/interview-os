import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { JobApplication } from '../../types';
import { APPLICATION_STAGES } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select, Textarea } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { todayISO } from '../../lib/dates';

const applicationSchema = z.object({
  companyName: z.string().trim().min(2, 'Add the company name.'),
  role: z.string().trim().min(2, 'Add the role you are targeting.'),
  website: z.string(),
  location: z.string(),
  workMode: z.enum(['Remote', 'Hybrid', 'On-site']),
  expectedCtc: z.string(),
  offeredCtc: z.string(),
  applicationDate: z.string(),
  stage: z.enum(APPLICATION_STAGES),
  nextInterviewDate: z.string(),
  followUpDate: z.string(),
  referralSource: z.string(),
  recruiterName: z.string(),
  recruiterContact: z.string(),
  jobDescription: z.string(),
  notes: z.string(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const workModes = ['Remote', 'Hybrid', 'On-site'] as const;

function toDefaults(application: JobApplication | null): ApplicationFormValues {
  return {
    companyName: application?.companyName ?? '',
    role: application?.role ?? 'Senior Frontend Engineer',
    website: application?.website ?? '',
    location: application?.location ?? '',
    workMode: application?.workMode ?? 'Hybrid',
    expectedCtc: application?.expectedCtc ?? '₹50L+',
    offeredCtc: application?.offeredCtc ?? '',
    applicationDate: application?.applicationDate ?? todayISO(),
    stage: application?.stage ?? 'To Research',
    nextInterviewDate: application?.nextInterviewDate ?? '',
    followUpDate: application?.followUpDate ?? '',
    referralSource: application?.referralSource ?? '',
    recruiterName: application?.recruiterName ?? '',
    recruiterContact: application?.recruiterContact ?? '',
    jobDescription: application?.jobDescription ?? '',
    notes: application?.notes ?? '',
  };
}

export function ApplicationFormDialog({
  open,
  onClose,
  application,
}: {
  open: boolean;
  onClose: () => void;
  application: JobApplication | null;
}) {
  const addApplication = useAppStore((state) => state.addApplication);
  const updateApplication = useAppStore((state) => state.updateApplication);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: toDefaults(application),
  });

  useEffect(() => {
    if (open) reset(toDefaults(application));
  }, [open, application, reset]);

  const onSubmit = (values: ApplicationFormValues) => {
    const payload = {
      companyName: values.companyName.trim(),
      role: values.role.trim(),
      website: values.website.trim(),
      location: values.location.trim(),
      workMode: values.workMode,
      expectedCtc: values.expectedCtc.trim(),
      offeredCtc: values.offeredCtc.trim(),
      applicationDate: values.applicationDate,
      stage: values.stage,
      nextInterviewDate: values.nextInterviewDate,
      followUpDate: values.followUpDate,
      referralSource: values.referralSource.trim(),
      recruiterName: values.recruiterName.trim(),
      recruiterContact: values.recruiterContact.trim(),
      jobDescription: values.jobDescription,
      notes: values.notes,
    };

    if (application) {
      updateApplication(application.id, payload);
      success('Application updated', { description: `${values.companyName} · ${values.stage}` });
    } else {
      addApplication(payload);
      success('Application added', { description: `${values.companyName} · ${values.stage}` });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={application ? 'Edit application' : 'Add application'}
      description="Track the role, stage, contacts and next actions. Everything stays in this browser."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="application-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            {application ? 'Save application' : 'Add application'}
          </Button>
        </>
      }
    >
      <form id="application-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormGrid>
          <Field label="Company" htmlFor="app-company" error={errors.companyName?.message} required>
            <Input
              id="app-company"
              data-autofocus
              {...register('companyName')}
              placeholder="e.g. Razorpay"
              aria-invalid={!!errors.companyName}
            />
          </Field>
          <Field label="Role" htmlFor="app-role" error={errors.role?.message} required>
            <Input id="app-role" {...register('role')} aria-invalid={!!errors.role} />
          </Field>
          <Field label="Website" htmlFor="app-website" hint="Optional">
            <Input id="app-website" {...register('website')} placeholder="company.com" />
          </Field>
          <Field label="Location" htmlFor="app-location">
            <Input id="app-location" {...register('location')} placeholder="Mumbai / Remote" />
          </Field>
          <Field label="Work mode" htmlFor="app-mode">
            <Select id="app-mode" {...register('workMode')}>
              {workModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stage" htmlFor="app-stage">
            <Select id="app-stage" {...register('stage')}>
              {APPLICATION_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expected CTC" htmlFor="app-expected">
            <Input id="app-expected" {...register('expectedCtc')} placeholder="₹50L+" />
          </Field>
          <Field label="Offered CTC" htmlFor="app-offered">
            <Input id="app-offered" {...register('offeredCtc')} placeholder="₹0" />
          </Field>
          <Field label="Application date" htmlFor="app-date">
            <Input id="app-date" type="date" {...register('applicationDate')} />
          </Field>
          <Field label="Next interview" htmlFor="app-next-interview" hint="Optional">
            <Input id="app-next-interview" type="date" {...register('nextInterviewDate')} />
          </Field>
          <Field label="Follow-up date" htmlFor="app-follow-up" hint="Optional reminder">
            <Input id="app-follow-up" type="date" {...register('followUpDate')} />
          </Field>
          <Field label="Referral source" htmlFor="app-referral">
            <Input id="app-referral" {...register('referralSource')} placeholder="LinkedIn, referral, careers page…" />
          </Field>
          <Field label="Recruiter name" htmlFor="app-recruiter">
            <Input id="app-recruiter" {...register('recruiterName')} />
          </Field>
          <Field label="Recruiter contact" htmlFor="app-contact">
            <Input id="app-contact" {...register('recruiterContact')} placeholder="Email or phone" />
          </Field>
        </FormGrid>

        <Field label="Job description" htmlFor="app-jd" hint="Paste the role requirements for quick reference">
          <Textarea id="app-jd" rows={4} {...register('jobDescription')} />
        </Field>
        <Field label="Notes" htmlFor="app-notes" hint="Interview prep notes, questions to ask, salary discussion points">
          <Textarea id="app-notes" rows={4} {...register('notes')} />
        </Field>
      </form>
    </Dialog>
  );
}
