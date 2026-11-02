import { useMemo } from 'react';
import { CalendarRange, Clock3, Gauge, Plus, Target } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { LinkButton } from '../../components/common/LinkButton';
import { StatCard } from '../../components/common/StatCard';
import { useAppStore } from '../../stores/useAppStore';
import { computeDashboard } from '../../lib/analytics/dashboard';
import { formatDate, getWeekLabel } from '../../lib/dates';
import { formatLakhs, truncate } from '../../lib/utils';
import { ModuleProgressChart, StudyHoursChart } from '../../components/charts/PreparationCharts';
import { ApplicationFunnelChart } from '../../components/charts/FunnelChart';
import { SkillProficiencyChart } from '../../components/charts/SkillChart';
import { InterviewPerformanceChart } from '../../components/charts/InterviewChart';
import {
  CurrentWeekPanel,
  ImprovementPanel,
  PipelineStrip,
  RecentActivityPanel,
  TodayPanel,
  UpcomingInterviewsPanel,
  UpcomingTasksPanel,
} from './DashboardPanels';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const data = useAppStore((state) => state.data);
  const metrics = useMemo(() => computeDashboard(data), [data]);
  const week = metrics.currentWeek;

  const description = week
    ? `${metrics.overallProgress}% ready for senior frontend interviews · Week ${week.number}: ${week.title}. Target: ${formatLakhs(metrics.targetCompensation)}+ in Mumbai or remote India.`
    : `Target: ${formatLakhs(metrics.targetCompensation)}+ in Mumbai or remote India.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={week ? `Week ${week.number} of ${metrics.totalWeeks} · ${getWeekLabel(week)}` : 'Preparation dashboard'}
        title={`${greeting()}, ${data.settings.userName}`}
        description={description}
        actions={
          <>
            <LinkButton to="/interviews" variant="outline">
              <CalendarRange className="h-4 w-4" />
              Log interview
            </LinkButton>
            <LinkButton to="/applications">
              <Plus className="h-4 w-4" />
              Add application
            </LinkButton>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall readiness"
          value={`${metrics.overallProgress}%`}
          hint="Roadmap, technical skill, goals and mock readiness"
          icon={Gauge}
        />
        <StatCard
          label="Current week"
          value={week ? `W${week.number}` : '—'}
          hint={week ? truncate(week.title, 44) : 'No active week'}
          icon={CalendarRange}
        />
        <StatCard
          label="Days to target LWD"
          value={metrics.daysToLwd}
          hint={`Target last working day ${formatDate(data.settings.targetLwd)}`}
          icon={Target}
        />
        <StatCard
          label="Weekly study"
          value={`${(metrics.weekCompletedMinutes / 60).toFixed(1)}h`}
          hint={`${(metrics.weekPlannedMinutes / 60).toFixed(1)}h planned · ${metrics.weekCompletion}% complete`}
          icon={Clock3}
        />
      </section>

      <PipelineStrip metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-3">
        <CurrentWeekPanel week={week} metrics={metrics} />
        <TodayPanel metrics={metrics} />
      </div>

      <section aria-label="Preparation analytics" className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StudyHoursChart
            data={metrics.studyDays}
            weeklyHours={metrics.weekCompletedMinutes / 60}
            plannedHours={metrics.weekPlannedMinutes / 60}
          />
        </div>
        <ModuleProgressChart data={metrics.moduleProgress} />
      </section>

      <section aria-label="Performance analytics" className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InterviewPerformanceChart data={metrics.mockTrend} average={metrics.mockAverage} />
        </div>
        <SkillProficiencyChart data={metrics.skillProficiency} />
      </section>

      <section aria-label="Pipeline and next actions" className="grid gap-4 lg:grid-cols-3">
        <ApplicationFunnelChart data={metrics.funnel} />
        <UpcomingInterviewsPanel items={metrics.upcomingInterviews} />
        <UpcomingTasksPanel tasks={metrics.upcomingTasks} week={week} />
      </section>

      <section aria-label="Activity and gaps" className="grid gap-4 lg:grid-cols-3">
        <RecentActivityPanel items={metrics.recentActivities} />
        <ImprovementPanel areas={metrics.improvementAreas} />
      </section>
    </div>
  );
}
