import { format } from 'date-fns';
import type { ApplicationStage, AppData, AppExport, JobApplication, RoadmapWeek, InterviewRecord } from '../../types';
import { SCHEMA_VERSION } from '../../data/initial-data';
import { downloadCsv } from '../csv';
import { downloadFile, nowISO } from '../utils';
import { appExportSchema } from './schemas';

export type ImportMode = 'merge' | 'replace';

export interface ImportValidationResult {
  success: boolean;
  data?: AppData;
  error?: string;
  summary?: {
    roadmap: number;
    applications: number;
    interviews: number;
    mocks: number;
    tasks: number;
    goals: number;
    companies: number;
    notes: number;
    topics: number;
  };
}

export function buildBackup(data: AppData): AppExport {
  return {
    app: 'interview-prep-os',
    version: SCHEMA_VERSION,
    exportedAt: nowISO(),
    data,
  };
}

export function downloadBackup(data: AppData) {
  const backup = buildBackup(data);
  downloadFile(
    JSON.stringify(backup, null, 2),
    `interview-prep-os-backup-${format(new Date(), 'yyyy-MM-dd')}.json`,
    'application/json',
  );
}

export function validateImportJson(raw: string): ImportValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: false, error: 'This file is not valid JSON.' };
  }

  const result = appExportSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const location = first?.path.length ? ` at ${first.path.join('.')}` : '';
    return {
      success: false,
      error: `The backup does not match the expected format${location}. ${first?.message ?? ''}`.trim(),
    };
  }

  if (result.data.version > SCHEMA_VERSION) {
    return {
      success: false,
      error: `This backup was created by a newer version (v${result.data.version}). Update the app before importing.`,
    };
  }

  const data = result.data.data as AppData;
  return {
    success: true,
    data,
    summary: {
      roadmap: data.roadmap.length,
      applications: data.applications.length,
      interviews: data.interviews.length,
      mocks: data.mockInterviews.length,
      tasks: data.tasks.length,
      goals: data.goals.length,
      companies: data.companies.length,
      notes: data.notes.length,
      topics: data.techCategories.reduce((sum, category) => sum + category.topics.length, 0),
    },
  };
}

export function exportApplicationsCsv(applications: JobApplication[]) {
  downloadCsv('applications.csv', applications, [
    { header: 'Company', value: (row) => row.companyName },
    { header: 'Role', value: (row) => row.role },
    { header: 'Stage', value: (row) => row.stage },
    { header: 'Location', value: (row) => row.location },
    { header: 'Work mode', value: (row) => row.workMode },
    { header: 'Expected CTC', value: (row) => row.expectedCtc },
    { header: 'Offered CTC', value: (row) => row.offeredCtc },
    { header: 'Applied on', value: (row) => row.applicationDate },
    { header: 'Next interview', value: (row) => row.nextInterviewDate },
    { header: 'Follow-up', value: (row) => row.followUpDate },
    { header: 'Recruiter', value: (row) => row.recruiterName },
    { header: 'Recruiter contact', value: (row) => row.recruiterContact },
    { header: 'Referral', value: (row) => row.referralSource },
    { header: 'Website', value: (row) => row.website },
    { header: 'Notes', value: (row) => row.notes },
  ]);
}

export function exportInterviewsCsv(interviews: InterviewRecord[]) {
  downloadCsv('interview-log.csv', interviews, [
    { header: 'Company', value: (row) => row.company },
    { header: 'Date', value: (row) => row.date },
    { header: 'Round', value: (row) => row.round },
    { header: 'Interviewer', value: (row) => row.interviewerName },
    { header: 'Result', value: (row) => row.result },
    { header: 'Topics', value: (row) => row.topics },
    { header: 'Questions', value: (row) => row.questions },
    { header: 'Went well', value: (row) => row.wentWell },
    { header: 'Struggled with', value: (row) => row.struggled },
    { header: 'Technical mistakes', value: (row) => row.technicalMistakes },
    { header: 'Communication feedback', value: (row) => row.communicationFeedback },
    { header: 'Improvement actions', value: (row) => row.improvementActions },
    { header: 'Next round', value: (row) => row.nextRoundDate },
  ]);
}

export function exportRoadmapCsv(roadmap: RoadmapWeek[]) {
  downloadCsv('preparation-roadmap.csv', roadmap, [
    { header: 'Week', value: (row) => row.number },
    { header: 'Title', value: (row) => row.title },
    { header: 'Start date', value: (row) => row.startDate },
    { header: 'End date', value: (row) => row.endDate },
    { header: 'Status', value: (row) => row.status },
    { header: 'Progress %', value: (row) => row.progress },
    { header: 'Technical focus', value: (row) => row.technicalFocus },
    { header: 'Topics', value: (row) => row.topics },
    { header: 'Exercises', value: (row) => row.exercises },
    { header: 'Mock objectives', value: (row) => row.mockObjectives },
    { header: 'Job search', value: (row) => row.jobSearch },
    { header: 'Deliverables', value: (row) => row.deliverables },
    { header: 'Application target', value: (row) => row.applicationTarget },
    { header: 'Notes', value: (row) => row.notes },
  ]);
}

export function stageLabel(stage: ApplicationStage): string {
  return stage;
}
