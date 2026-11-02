export type ISODate = string;
export type ISODateTime = string;

export interface BaseEntity {
  id: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  userName: string;
  theme: ThemeMode;
  defaultStudyDuration: number;
  dailyStudyGoalHours: number;
  targetCompensation: number;
  prepStartDate: ISODate;
  plannedResignationDate: ISODate;
  noticePeriodDays: number;
  targetLwd: ISODate;
  preferredLocations: string[];
  preferredRoles: string[];
}

/* ------------------------------------------------------------------ */
/* Roadmap                                                             */
/* ------------------------------------------------------------------ */

export type WeekStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Needs Revision' | 'On Hold';

export interface RoadmapTask {
  id: string;
  title: string;
  done: boolean;
}

export interface RoadmapWeek extends BaseEntity {
  number: number;
  title: string;
  startDate: ISODate;
  endDate: ISODate;
  technicalFocus: string[];
  topics: string[];
  exercises: string[];
  mockObjectives: string[];
  jobSearch: string[];
  deliverables: string[];
  applicationTarget: number;
  status: WeekStatus;
  notes: string;
  tasks: RoadmapTask[];
  progress: number;
}

/* ------------------------------------------------------------------ */
/* Timetable                                                           */
/* ------------------------------------------------------------------ */

export type ActivityCategory =
  | 'Technical Concepts'
  | 'Hands-on Coding'
  | 'Interview Communication'
  | 'System Design'
  | 'Mock Interview'
  | 'Review & Applications'
  | 'DSA / Machine Coding'
  | 'Weak-area Revision'
  | 'Planning'
  | 'Custom';

export interface TimetableSlot extends BaseEntity {
  /** 1 = Monday … 7 = Sunday */
  dayOfWeek: number;
  title: string;
  category: ActivityCategory;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export type SlotStatus = 'done' | 'skipped';

export interface DailyLog {
  notes: string;
  statuses: Record<string, SlotStatus>;
}

/* ------------------------------------------------------------------ */
/* Technical preparation                                               */
/* ------------------------------------------------------------------ */

export type TopicStatus = 'Not Started' | 'Learning' | 'Practiced' | 'Confident' | 'Mastered';

export interface TechTopic extends BaseEntity {
  name: string;
  status: TopicStatus;
  confidence: number;
  notes: string;
  revisionDate: ISODate | '';
  questions: string[];
  exercises: string[];
}

export interface TechCategory extends BaseEntity {
  name: string;
  description: string;
  topics: TechTopic[];
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export const APPLICATION_STAGES = [
  'To Research',
  'Referral Requested',
  'Applied',
  'Recruiter Screen',
  'Technical Round',
  'Machine Coding Round',
  'System Design Round',
  'Hiring Manager Round',
  'HR / Offer',
  'Offer Received',
  'Rejected',
  'Withdrawn',
  'On Hold',
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const ACTIVE_STAGES: ApplicationStage[] = [
  'To Research',
  'Referral Requested',
  'Applied',
  'Recruiter Screen',
  'Technical Round',
  'Machine Coding Round',
  'System Design Round',
  'Hiring Manager Round',
  'HR / Offer',
  'Offer Received',
];

export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';

export interface StageHistoryEntry {
  id: string;
  date: ISODateTime;
  from: ApplicationStage | null;
  to: ApplicationStage;
  note: string;
}

export interface JobApplication extends BaseEntity {
  companyName: string;
  website: string;
  role: string;
  jobDescription: string;
  location: string;
  workMode: WorkMode;
  expectedCtc: string;
  offeredCtc: string;
  recruiterName: string;
  recruiterContact: string;
  referralSource: string;
  applicationDate: ISODate;
  stage: ApplicationStage;
  nextInterviewDate: ISODate | '';
  followUpDate: ISODate | '';
  notes: string;
  history: StageHistoryEntry[];
}

/* ------------------------------------------------------------------ */
/* Interview log                                                       */
/* ------------------------------------------------------------------ */

export type InterviewResult = 'Pending' | 'Passed' | 'Failed' | 'Offer' | 'No Show';

export interface InterviewRecord extends BaseEntity {
  applicationId: string;
  company: string;
  date: ISODate;
  round: string;
  interviewerName: string;
  questions: string;
  topics: string[];
  wentWell: string;
  struggled: string;
  technicalMistakes: string;
  communicationFeedback: string;
  improvementActions: string;
  result: InterviewResult;
  nextRoundDate: ISODate | '';
}

/* ------------------------------------------------------------------ */
/* Mock interviews                                                     */
/* ------------------------------------------------------------------ */

export const MOCK_INTERVIEW_TYPES = [
  'JavaScript',
  'React',
  'TypeScript',
  'Machine Coding',
  'DSA',
  'Frontend System Design',
  'Behavioral',
  'HR',
] as const;

export type MockInterviewType = (typeof MOCK_INTERVIEW_TYPES)[number];

export interface MockInterview extends BaseEntity {
  type: MockInterviewType;
  date: ISODate;
  durationMinutes: number;
  topics: string[];
  score: number;
  strengths: string;
  weaknesses: string;
  feedback: string;
  actionItems: string;
}

/* ------------------------------------------------------------------ */
/* Tasks & goals                                                       */
/* ------------------------------------------------------------------ */

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export interface Task extends BaseEntity {
  title: string;
  description: string;
  dueDate: ISODate | '';
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  relatedWeekId: string;
  relatedTopicId: string;
}

export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'At Risk';

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal extends BaseEntity {
  title: string;
  targetDate: ISODate;
  description: string;
  progress: number;
  status: GoalStatus;
  milestones: Milestone[];
}

/* ------------------------------------------------------------------ */
/* Company research                                                    */
/* ------------------------------------------------------------------ */

export const COMPANY_CATEGORIES = ['Dream', 'Target', 'Backup', 'Startup'] as const;
export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface Company extends BaseEntity {
  name: string;
  website: string;
  industry: string;
  category: CompanyCategory;
  cultureNotes: string;
  targetRoles: string[];
  salaryRange: string;
  interviewProcess: string;
  techStack: string[];
  reviewNotes: string;
  priority: Priority;
  applicationStatus: string;
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

export const NOTE_CATEGORIES = [
  'JavaScript',
  'React',
  'System Design',
  'DSA',
  'Interview Questions',
  'Architecture',
  'Resources',
  'Interview Feedback',
  'General',
] as const;

export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export interface Note extends BaseEntity {
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
  pinned: boolean;
}

/* ------------------------------------------------------------------ */
/* Application data                                                    */
/* ------------------------------------------------------------------ */

export interface AppData {
  settings: Settings;
  roadmap: RoadmapWeek[];
  timetable: TimetableSlot[];
  dailyLogs: Record<string, DailyLog>;
  techCategories: TechCategory[];
  applications: JobApplication[];
  interviews: InterviewRecord[];
  mockInterviews: MockInterview[];
  tasks: Task[];
  goals: Goal[];
  companies: Company[];
  notes: Note[];
}

export interface AppExport {
  app: 'interview-prep-os';
  version: number;
  exportedAt: ISODateTime;
  data: AppData;
}

export interface ActivityItem {
  id: string;
  type: 'application' | 'interview' | 'mock' | 'task' | 'goal' | 'note' | 'company' | 'week';
  title: string;
  description: string;
  timestamp: ISODateTime;
  href: string;
}

export interface InterviewPipelineItem {
  stage: ApplicationStage;
  count: number;
}
