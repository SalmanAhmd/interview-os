import { z } from 'zod';
import {
  APPLICATION_STAGES,
  COMPANY_CATEGORIES,
  MOCK_INTERVIEW_TYPES,
  NOTE_CATEGORIES,
  PRIORITIES,
} from '../../types';

const isoDate = z.string();
const isoDateTime = z.string();

const base = {
  id: z.string().min(1),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
};

export const settingsSchema = z.object({
  userName: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  defaultStudyDuration: z.number().positive(),
  dailyStudyGoalHours: z.number().nonnegative(),
  targetCompensation: z.number().nonnegative(),
  prepStartDate: isoDate,
  plannedResignationDate: isoDate,
  noticePeriodDays: z.number().nonnegative(),
  targetLwd: isoDate,
  preferredLocations: z.array(z.string()),
  preferredRoles: z.array(z.string()),
});

export const roadmapTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
});

export const roadmapWeekSchema = z.object({
  ...base,
  number: z.number().int().positive(),
  title: z.string(),
  startDate: isoDate,
  endDate: isoDate,
  technicalFocus: z.array(z.string()),
  topics: z.array(z.string()),
  exercises: z.array(z.string()),
  mockObjectives: z.array(z.string()),
  jobSearch: z.array(z.string()),
  deliverables: z.array(z.string()),
  applicationTarget: z.number().nonnegative(),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'Needs Revision', 'On Hold']),
  notes: z.string(),
  tasks: z.array(roadmapTaskSchema),
  progress: z.number().min(0).max(100),
});

export const timetableSlotSchema = z.object({
  ...base,
  dayOfWeek: z.number().int().min(1).max(7),
  title: z.string(),
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
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().nonnegative(),
});

export const dailyLogSchema = z.object({
  notes: z.string(),
  statuses: z.record(z.string(), z.enum(['done', 'skipped'])),
});

export const techTopicSchema = z.object({
  ...base,
  name: z.string(),
  status: z.enum(['Not Started', 'Learning', 'Practiced', 'Confident', 'Mastered']),
  confidence: z.number().min(1).max(5),
  notes: z.string(),
  revisionDate: z.string(),
  questions: z.array(z.string()),
  exercises: z.array(z.string()),
});

export const techCategorySchema = z.object({
  ...base,
  name: z.string(),
  description: z.string(),
  topics: z.array(techTopicSchema),
});

export const stageHistorySchema = z.object({
  id: z.string(),
  date: isoDateTime,
  from: z.enum(APPLICATION_STAGES).nullable(),
  to: z.enum(APPLICATION_STAGES),
  note: z.string(),
});

export const jobApplicationSchema = z.object({
  ...base,
  companyName: z.string().min(1),
  website: z.string(),
  role: z.string(),
  jobDescription: z.string(),
  location: z.string(),
  workMode: z.enum(['Remote', 'Hybrid', 'On-site']),
  expectedCtc: z.string(),
  offeredCtc: z.string(),
  recruiterName: z.string(),
  recruiterContact: z.string(),
  referralSource: z.string(),
  applicationDate: isoDate,
  stage: z.enum(APPLICATION_STAGES),
  nextInterviewDate: z.string(),
  followUpDate: z.string(),
  notes: z.string(),
  history: z.array(stageHistorySchema),
});

export const interviewRecordSchema = z.object({
  ...base,
  applicationId: z.string(),
  company: z.string(),
  date: isoDate,
  round: z.string(),
  interviewerName: z.string(),
  questions: z.string(),
  topics: z.array(z.string()),
  wentWell: z.string(),
  struggled: z.string(),
  technicalMistakes: z.string(),
  communicationFeedback: z.string(),
  improvementActions: z.string(),
  result: z.enum(['Pending', 'Passed', 'Failed', 'Offer', 'No Show']),
  nextRoundDate: z.string(),
});

export const mockInterviewSchema = z.object({
  ...base,
  type: z.enum(MOCK_INTERVIEW_TYPES),
  date: isoDate,
  durationMinutes: z.number().positive(),
  topics: z.array(z.string()),
  score: z.number().min(0).max(10),
  strengths: z.string(),
  weaknesses: z.string(),
  feedback: z.string(),
  actionItems: z.string(),
});

export const taskSchema = z.object({
  ...base,
  title: z.string().min(1),
  description: z.string(),
  dueDate: z.string(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  status: z.enum(['Todo', 'In Progress', 'Done']),
  category: z.string(),
  relatedWeekId: z.string(),
  relatedTopicId: z.string(),
});

export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
});

export const goalSchema = z.object({
  ...base,
  title: z.string().min(1),
  targetDate: isoDate,
  description: z.string(),
  progress: z.number().min(0).max(100),
  status: z.enum(['Not Started', 'In Progress', 'Completed', 'At Risk']),
  milestones: z.array(milestoneSchema),
});

export const companySchema = z.object({
  ...base,
  name: z.string().min(1),
  website: z.string(),
  industry: z.string(),
  category: z.enum(COMPANY_CATEGORIES),
  cultureNotes: z.string(),
  targetRoles: z.array(z.string()),
  salaryRange: z.string(),
  interviewProcess: z.string(),
  techStack: z.array(z.string()),
  reviewNotes: z.string(),
  priority: z.enum(PRIORITIES),
  applicationStatus: z.string(),
});

export const noteSchema = z.object({
  ...base,
  title: z.string().min(1),
  content: z.string(),
  category: z.enum(NOTE_CATEGORIES),
  tags: z.array(z.string()),
  pinned: z.boolean(),
});

export const appDataSchema = z.object({
  settings: settingsSchema,
  roadmap: z.array(roadmapWeekSchema),
  timetable: z.array(timetableSlotSchema),
  dailyLogs: z.record(z.string(), dailyLogSchema),
  techCategories: z.array(techCategorySchema),
  applications: z.array(jobApplicationSchema),
  interviews: z.array(interviewRecordSchema),
  mockInterviews: z.array(mockInterviewSchema),
  tasks: z.array(taskSchema),
  goals: z.array(goalSchema),
  companies: z.array(companySchema),
  notes: z.array(noteSchema),
});

export const appExportSchema = z.object({
  app: z.literal('interview-prep-os'),
  version: z.number().int().positive(),
  exportedAt: z.string(),
  data: appDataSchema,
});
