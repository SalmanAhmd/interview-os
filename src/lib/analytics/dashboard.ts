import { format, subWeeks } from 'date-fns';
import type {
  ActivityItem,
  AppData,
  ApplicationStage,
  InterviewPipelineItem,
  RoadmapWeek,
  Task,
} from '../../types';
import { APPLICATION_STAGES, ACTIVE_STAGES } from '../../types';
import { daysUntil, getWeekForDate, INPUT_DATE, todayISO } from '../dates';
import { average, clamp, percent, sortByDateDesc, truncate } from '../utils';
import { getDayStudyStats, getStudyStreak, getWeekStudyStats, summarizeWeek } from './timetable';

export interface ImprovementArea {
  id: string;
  title: string;
  detail: string;
  severity: 'high' | 'medium';
  href: string;
}

export interface UpcomingInterview {
  id: string;
  company: string;
  role: string;
  date: string;
  round: string;
  source: 'Application' | 'Interview log';
  href: string;
}

export interface StudyWeekPoint {
  key: string;
  label: string;
  completedMinutes: number;
  plannedMinutes: number;
}

export interface DashboardData {
  overallProgress: number;
  moduleProgress: { name: string; value: number }[];
  roadmapProgress: number;
  skillProgress: number;
  goalProgress: number;
  taskProgress: number;
  mockProgress: number;
  studyProgress: number;
  completedWeeks: number;
  totalWeeks: number;
  currentWeek?: RoadmapWeek;
  daysToLwd: number;
  targetCompensation: number;
  todayCompletion: number;
  todayCompletedMinutes: number;
  todayPlannedMinutes: number;
  todayDoneSlots: number;
  todayTotalSlots: number;
  weekCompletedMinutes: number;
  weekPlannedMinutes: number;
  weekCompletion: number;
  studyStreak: number;
  totalApplications: number;
  activeApplications: number;
  offers: number;
  interviewsScheduled: number;
  mockCount: number;
  mockAverage: number;
  pipeline: InterviewPipelineItem[];
  funnel: InterviewPipelineItem[];
  upcomingInterviews: UpcomingInterview[];
  recentActivities: ActivityItem[];
  improvementAreas: ImprovementArea[];
  studyDays: { label: string; completed: number; planned: number; completion: number }[];
  studyTrend: StudyWeekPoint[];
  skillProficiency: { name: string; score: number; topics: number }[];
  mockTrend: { label: string; score: number; type: string }[];
  interviewResults: { name: string; value: number }[];
  upcomingTasks: Task[];
  lowConfidenceCount: number;
}

function getRecentActivities(data: AppData): ActivityItem[] {
  const items: ActivityItem[] = [];

  data.applications.forEach((application) => {
    items.push({
      id: `app-${application.id}`,
      type: 'application',
      title: `${application.companyName} · ${application.stage}`,
      description: `${application.role || 'Frontend role'} application updated`,
      timestamp: application.updatedAt,
      href: '/applications',
    });
  });

  data.interviews.forEach((interview) => {
    items.push({
      id: `int-${interview.id}`,
      type: 'interview',
      title: `${interview.company} interview logged`,
      description: `${interview.round} · ${interview.result}`,
      timestamp: interview.createdAt,
      href: '/interviews',
    });
  });

  data.mockInterviews.forEach((mock) => {
    items.push({
      id: `mock-${mock.id}`,
      type: 'mock',
      title: `${mock.type} mock completed`,
      description: `Scored ${mock.score}/10 · ${mock.durationMinutes} min`,
      timestamp: mock.createdAt,
      href: '/mock-interviews',
    });
  });

  data.tasks.forEach((task) => {
    items.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.status === 'Done' ? `Task completed: ${task.title}` : `Task updated: ${task.title}`,
      description: `${task.priority} priority · ${task.status}`,
      timestamp: task.updatedAt,
      href: '/tasks',
    });
  });

  data.notes.forEach((note) => {
    items.push({
      id: `note-${note.id}`,
      type: 'note',
      title: `Note updated: ${note.title}`,
      description: note.category,
      timestamp: note.updatedAt,
      href: '/notes',
    });
  });

  data.companies.forEach((company) => {
    items.push({
      id: `company-${company.id}`,
      type: 'company',
      title: `Company research: ${company.name}`,
      description: `${company.category} company · ${company.priority} priority`,
      timestamp: company.updatedAt,
      href: '/companies',
    });
  });

  const activeWeek = data.roadmap.find((week) => week.status !== 'Not Started');
  if (activeWeek) {
    items.push({
      id: `week-${activeWeek.id}`,
      type: 'week',
      title: `Week ${activeWeek.number}: ${activeWeek.title}`,
      description: `${activeWeek.status} · ${activeWeek.progress}% complete`,
      timestamp: activeWeek.updatedAt,
      href: '/roadmap',
    });
  }

  if (data.settings.prepStartDate) {
    const start = new Date(`${data.settings.prepStartDate}T09:00:00`);
    items.push({
      id: 'journey-start',
      type: 'week',
      title: 'Preparation journey started',
      description: `${data.settings.preferredRoles[0] ?? 'Senior Frontend Engineer'} · target ${settingsTargetLabel(data)}`,
      timestamp: start.toISOString(),
      href: '/roadmap',
    });
  }

  return sortByDateDesc(items, (item) => item.timestamp).slice(0, 8);
}

function settingsTargetLabel(data: AppData): string {
  const value = data.settings.targetCompensation;
  return `₹${(value / 1_00_000).toFixed(0)} LPA`;
}

function getImprovementAreas(data: AppData): ImprovementArea[] {
  const areas: ImprovementArea[] = [];
  const today = todayISO();

  const lowTopics = data.techCategories
    .flatMap((category) =>
      category.topics
        .filter((topic) => topic.confidence <= 2)
        .map((topic) => ({ category: category.name, topic })),
    )
    .sort((a, b) => a.topic.confidence - b.topic.confidence)
    .slice(0, 3);

  lowTopics.forEach(({ category, topic }) => {
    areas.push({
      id: `topic-${topic.id}`,
      title: `${topic.name} needs work`,
      detail: `${category} · confidence ${topic.confidence}/5 · ${topic.status}`,
      severity: topic.confidence <= 1 ? 'high' : 'medium',
      href: '/technical',
    });
  });

  data.applications
    .filter(
      (application) =>
        application.followUpDate &&
        application.followUpDate <= today &&
        ACTIVE_STAGES.includes(application.stage),
    )
    .slice(0, 2)
    .forEach((application) => {
      areas.push({
        id: `follow-${application.id}`,
        title: `Follow up with ${application.companyName}`,
        detail: `Follow-up was due ${application.followUpDate} · ${application.stage}`,
        severity: 'high',
        href: '/applications',
      });
    });

  const revisionWeeks = data.roadmap.filter(
    (week) => week.status === 'Needs Revision' || week.status === 'On Hold',
  );
  revisionWeeks.slice(0, 2).forEach((week) => {
    areas.push({
      id: `week-${week.id}`,
      title: `Week ${week.number} is ${week.status.toLowerCase()}`,
      detail: week.title,
      severity: week.status === 'Needs Revision' ? 'high' : 'medium',
      href: '/roadmap',
    });
  });

  const latestMock = sortByDateDesc(data.mockInterviews, (mock) => mock.date)[0];
  if (latestMock?.weaknesses) {
    areas.push({
      id: `mock-${latestMock.id}`,
      title: 'Mock interview gap',
      detail: truncate(latestMock.weaknesses, 110),
      severity: latestMock.score < 6 ? 'high' : 'medium',
      href: '/mock-interviews',
    });
  }

  const recentStruggle = sortByDateDesc(
    data.interviews.filter((interview) => interview.struggled.trim()),
    (interview) => interview.date,
  )[0];
  if (recentStruggle) {
    areas.push({
      id: `int-${recentStruggle.id}`,
      title: `Struggled at ${recentStruggle.company}`,
      detail: truncate(recentStruggle.struggled, 110),
      severity: 'high',
      href: '/interviews',
    });
  }

  return areas.slice(0, 5);
}

function getUpcomingInterviews(data: AppData): UpcomingInterview[] {
  const today = todayISO();
  const items: UpcomingInterview[] = [];

  data.applications.forEach((application) => {
    if (
      application.nextInterviewDate &&
      application.nextInterviewDate >= today &&
      ACTIVE_STAGES.includes(application.stage)
    ) {
      items.push({
        id: `app-${application.id}`,
        company: application.companyName,
        role: application.role || 'Frontend role',
        date: application.nextInterviewDate,
        round: application.stage,
        source: 'Application',
        href: '/applications',
      });
    }
  });

  data.interviews.forEach((interview) => {
    if (interview.nextRoundDate && interview.nextRoundDate >= today) {
      items.push({
        id: `int-${interview.id}`,
        company: interview.company,
        role: interview.round,
        date: interview.nextRoundDate,
        round: 'Next round',
        source: 'Interview log',
        href: '/interviews',
      });
    }
    if (interview.date >= today) {
      items.push({
        id: `int-now-${interview.id}`,
        company: interview.company,
        role: interview.round,
        date: interview.date,
        round: interview.round,
        source: 'Interview log',
        href: '/interviews',
      });
    }
  });

  return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
}

function buildPipeline(data: AppData): InterviewPipelineItem[] {
  return APPLICATION_STAGES.map((stage) => ({
    stage,
    count: data.applications.filter((application) => application.stage === stage).length,
  }));
}

export function computeDashboard(data: AppData, reference = new Date()): DashboardData {
  const roadmapProgress = average(data.roadmap.map((week) => week.progress));
  const allTopics = data.techCategories.flatMap((category) => category.topics);
  const skillProgress = percent(average(allTopics.map((topic) => topic.confidence)), 5);
  const goalProgress = average(data.goals.map((goal) => goal.progress));
  const taskProgress = data.tasks.length
    ? percent(
        data.tasks.filter((task) => task.status === 'Done').length,
        data.tasks.length,
      )
    : 0;
  const mockProgress = clamp((data.mockInterviews.length / 10) * 100);
  const weekDays = getWeekStudyStats(data, reference);
  const weekSummary = summarizeWeek(weekDays);
  const studyProgress = weekSummary.completion;
  const today = getDayStudyStats(data, reference);

  const weighted: { value: number; weight: number }[] = [
    { value: roadmapProgress, weight: 0.28 },
    { value: skillProgress, weight: 0.26 },
    { value: goalProgress, weight: 0.16 },
    { value: studyProgress, weight: 0.12 },
    { value: mockProgress, weight: 0.1 },
  ];
  if (data.tasks.length) weighted.push({ value: taskProgress, weight: 0.08 });

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const overallProgress = totalWeight
    ? Math.round(weighted.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / totalWeight)
    : 0;

  const mockScores = data.mockInterviews.map((mock) => mock.score);
  const mockAverage = average(mockScores);
  const mockTrend = [...data.mockInterviews]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map((mock) => ({ label: format(new Date(`${mock.date}T00:00:00`), 'd MMM'), score: mock.score, type: mock.type }));

  const results = ['Pending', 'Passed', 'Failed', 'Offer', 'No Show'];
  const interviewResults = results
    .map((result) => ({
      name: result,
      value: data.interviews.filter((interview) => interview.result === result).length,
    }))
    .filter((entry) => entry.value > 0);

  const studyTrend: StudyWeekPoint[] = [3, 2, 1, 0].map((offset) => {
    const weekReference = subWeeks(reference, offset);
    const summary = summarizeWeek(getWeekStudyStats(data, weekReference));
    return {
      key: format(weekReference, INPUT_DATE),
      label: offset === 0 ? 'This week' : `−${offset}w`,
      completedMinutes: summary.completedMinutes,
      plannedMinutes: summary.plannedMinutes,
    };
  });

  return {
    overallProgress,
    moduleProgress: [
      { name: 'Roadmap', value: Math.round(roadmapProgress) },
      { name: 'Technical', value: skillProgress },
      { name: 'Goals', value: Math.round(goalProgress) },
      { name: 'Study plan', value: studyProgress },
      { name: 'Mock interviews', value: Math.round(mockProgress) },
      ...(data.tasks.length ? [{ name: 'Tasks', value: taskProgress }] : []),
    ],
    roadmapProgress,
    skillProgress,
    goalProgress,
    taskProgress,
    mockProgress,
    studyProgress,
    completedWeeks: data.roadmap.filter((week) => week.status === 'Completed').length,
    totalWeeks: data.roadmap.length,
    currentWeek: getWeekForDate(data.roadmap, reference),
    daysToLwd: Math.max(0, daysUntil(data.settings.targetLwd, reference)),
    targetCompensation: data.settings.targetCompensation,
    todayCompletion: today.completion,
    todayCompletedMinutes: today.completedMinutes,
    todayPlannedMinutes: today.plannedMinutes,
    todayDoneSlots: today.doneSlots,
    todayTotalSlots: today.totalSlots,
    weekCompletedMinutes: weekSummary.completedMinutes,
    weekPlannedMinutes: weekSummary.plannedMinutes,
    weekCompletion: weekSummary.completion,
    studyStreak: getStudyStreak(data),
    totalApplications: data.applications.length,
    activeApplications: data.applications.filter((application) =>
      ACTIVE_STAGES.includes(application.stage),
    ).length,
    offers: data.applications.filter((application) => application.stage === 'Offer Received').length,
    interviewsScheduled: getUpcomingInterviews(data).length,
    mockCount: data.mockInterviews.length,
    mockAverage,
    pipeline: buildPipeline(data),
    funnel: buildPipeline(data).filter((item) => ACTIVE_STAGES.includes(item.stage as ApplicationStage)),
    upcomingInterviews: getUpcomingInterviews(data),
    recentActivities: getRecentActivities(data),
    improvementAreas: getImprovementAreas(data),
    studyDays: weekDays.map((day) => ({
      label: day.dayLabel,
      completed: Number((day.completedMinutes / 60).toFixed(2)),
      planned: Number((day.plannedMinutes / 60).toFixed(2)),
      completion: day.completion,
    })),
    studyTrend,
    skillProficiency: data.techCategories.map((category) => ({
      name: category.name,
      score: category.topics.length
        ? Math.round((average(category.topics.map((topic) => topic.confidence)) / 5) * 100)
        : 0,
      topics: category.topics.length,
    })),
    mockTrend,
    interviewResults,
    upcomingTasks: [...data.tasks]
      .filter((task) => task.status !== 'Done')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 5),
    lowConfidenceCount: allTopics.filter((topic) => topic.confidence <= 2).length,
  };
}

export function computeApplicationMetrics(data: AppData) {
  const total = data.applications.length;
  const applied = data.applications.filter((application) =>
    !['To Research', 'Referral Requested'].includes(application.stage),
  ).length;
  const screened = data.applications.filter((application) =>
    [
      'Recruiter Screen',
      'Technical Round',
      'Machine Coding Round',
      'System Design Round',
      'Hiring Manager Round',
      'HR / Offer',
      'Offer Received',
    ].includes(application.stage),
  ).length;
  const interviewed = data.applications.filter((application) =>
    [
      'Technical Round',
      'Machine Coding Round',
      'System Design Round',
      'Hiring Manager Round',
      'HR / Offer',
      'Offer Received',
    ].includes(application.stage),
  ).length;
  const offers = data.applications.filter((application) => application.stage === 'Offer Received').length;
  const rejected = data.applications.filter((application) => application.stage === 'Rejected').length;

  return {
    total,
    applied,
    screened,
    interviewed,
    offers,
    rejected,
    applicationToScreenRate: percent(screened, applied),
    screenToInterviewRate: percent(interviewed, screened),
    interviewToOfferRate: percent(offers, interviewed),
    responseRate: percent(
      data.applications.filter((application) =>
        !['To Research', 'Applied'].includes(application.stage),
      ).length,
      applied,
    ),
  };
}

export function computeWeeklyMilestones(roadmap: RoadmapWeek[]) {
  return {
    completed: roadmap.filter((week) => week.status === 'Completed').length,
    pending: roadmap.filter((week) => week.status !== 'Completed').length,
    needsRevision: roadmap.filter((week) => week.status === 'Needs Revision').length,
    inProgress: roadmap.filter((week) => week.status === 'In Progress').length,
  };
}
