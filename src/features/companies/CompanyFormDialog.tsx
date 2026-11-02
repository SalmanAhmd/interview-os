import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import type { Company } from '../../types';
import { COMPANY_CATEGORIES, PRIORITIES } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Select, Textarea } from '../../components/ui/input';
import { joinLines, splitLines } from '../../lib/utils';

const companySchema = z.object({
  name: z.string().trim().min(2, 'Add the company name.'),
  website: z.string(),
  industry: z.string(),
  category: z.enum(COMPANY_CATEGORIES),
  priority: z.enum(PRIORITIES),
  salaryRange: z.string(),
  applicationStatus: z.string(),
  targetRoles: z.string(),
  techStack: z.string(),
  interviewProcess: z.string(),
  cultureNotes: z.string(),
  reviewNotes: z.string(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

function toDefaults(company: Company | null): CompanyFormValues {
  return {
    name: company?.name ?? '',
    website: company?.website ?? '',
    industry: company?.industry ?? '',
    category: company?.category ?? 'Target',
    priority: company?.priority ?? 'Medium',
    salaryRange: company?.salaryRange ?? '',
    applicationStatus: company?.applicationStatus ?? '',
    targetRoles: joinLines(company?.targetRoles ?? []),
    techStack: joinLines(company?.techStack ?? []),
    interviewProcess: company?.interviewProcess ?? '',
    cultureNotes: company?.cultureNotes ?? '',
    reviewNotes: company?.reviewNotes ?? '',
  };
}

export function CompanyFormDialog({
  open,
  onClose,
  company,
}: {
  open: boolean;
  onClose: () => void;
  company: Company | null;
}) {
  const addCompany = useAppStore((state) => state.addCompany);
  const updateCompany = useAppStore((state) => state.updateCompany);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: toDefaults(company),
  });

  useEffect(() => {
    if (open) reset(toDefaults(company));
  }, [open, company, reset]);

  const onSubmit = (values: CompanyFormValues) => {
    const payload = {
      name: values.name.trim(),
      website: values.website.trim(),
      industry: values.industry.trim(),
      category: values.category,
      priority: values.priority,
      salaryRange: values.salaryRange.trim(),
      applicationStatus: values.applicationStatus.trim(),
      targetRoles: splitLines(values.targetRoles),
      techStack: splitLines(values.techStack),
      interviewProcess: values.interviewProcess,
      cultureNotes: values.cultureNotes,
      reviewNotes: values.reviewNotes,
    };
    if (company) {
      updateCompany(company.id, payload);
      success('Company updated', { description: values.name });
    } else {
      addCompany(payload);
      success('Company added', { description: values.name });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={company ? 'Edit company research' : 'Add company research'}
      description="Build a target list with culture notes, process, tech stack and negotiation context."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="company-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            {company ? 'Save company' : 'Add company'}
          </Button>
        </>
      }
    >
      <form id="company-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormGrid>
          <Field label="Company" htmlFor="company-name" error={errors.name?.message} required>
            <Input
              id="company-name"
              data-autofocus
              {...register('name')}
              placeholder="e.g. Razorpay"
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field label="Website" htmlFor="company-website">
            <Input id="company-website" {...register('website')} placeholder="razorpay.com" />
          </Field>
          <Field label="Industry" htmlFor="company-industry">
            <Input id="company-industry" {...register('industry')} placeholder="Fintech, SaaS, e-commerce…" />
          </Field>
          <Field label="Category" htmlFor="company-category">
            <Select id="company-category" {...register('category')}>
              {COMPANY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="company-priority">
            <Select id="company-priority" {...register('priority')}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Salary range" htmlFor="company-salary">
            <Input id="company-salary" {...register('salaryRange')} placeholder="₹45–60L" />
          </Field>
          <Field label="Application status" htmlFor="company-status">
            <Input id="company-status" {...register('applicationStatus')} placeholder="Not started, Applied, In process…" />
          </Field>
          <Field label="Target roles" htmlFor="company-roles" hint="One per line">
            <Textarea id="company-roles" rows={3} {...register('targetRoles')} />
          </Field>
          <Field label="Tech stack" htmlFor="company-stack" hint="One per line">
            <Textarea id="company-stack" rows={3} {...register('techStack')} />
          </Field>
        </FormGrid>

        <Field label="Interview process" htmlFor="company-process" hint="Rounds, format, duration, known focus areas">
          <Textarea id="company-process" rows={4} {...register('interviewProcess')} />
        </Field>
        <FormGrid>
          <Field label="Culture notes" htmlFor="company-culture">
            <Textarea id="company-culture" rows={4} {...register('cultureNotes')} />
          </Field>
          <Field label="Review notes" htmlFor="company-review">
            <Textarea id="company-review" rows={4} {...register('reviewNotes')} />
          </Field>
        </FormGrid>
      </form>
    </Dialog>
  );
}
