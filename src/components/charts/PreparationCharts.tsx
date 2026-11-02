import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartEmpty, ChartFrame, ChartTooltip, axisProps, chartColors } from './chart-utils';

export function ModuleProgressChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (!data.length) {
    return (
      <ChartFrame title="Preparation progress" description="Readiness across each module">
        <ChartEmpty message="Progress appears once your preparation plan has data." />
      </ChartFrame>
    );
  }

  return (
    <ChartFrame
      title="Preparation progress"
      description="Readiness across each module"
      height={248}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 34, left: 4, bottom: 0 }}
          barCategoryGap={14}
        >
          <CartesianGrid horizontal={false} stroke={chartColors.grid} strokeOpacity={0.7} />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={84}
            {...axisProps}
            tick={{ ...axisProps.tick, fontSize: 10 }}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
            content={<ChartTooltip formatter={(value) => `${value}%`} />}
          />
          <Bar dataKey="value" name="Progress" fill={chartColors.accent} radius={[0, 4, 4, 0]} barSize={13}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: unknown) => `${value}%`}
              style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function StudyHoursChart({
  data,
  weeklyHours,
  plannedHours,
}: {
  data: { label: string; completed: number; planned: number; completion: number }[];
  weeklyHours: number;
  plannedHours: number;
}) {
  return (
    <ChartFrame
      title="Weekly study hours"
      description={
        plannedHours > 0
          ? `${weeklyHours.toFixed(1)}h completed of ${plannedHours.toFixed(1)}h planned this week`
          : 'No study slots scheduled this week'
      }
      height={250}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }} barGap={3}>
          <CartesianGrid vertical={false} stroke={chartColors.grid} strokeOpacity={0.7} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            {...axisProps}
            tickFormatter={(value: number) => `${value}h`}
            width={42}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
            content={<ChartTooltip formatter={(value) => `${Number(value).toFixed(1)}h`} />}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', paddingTop: 6 }}
          />
          <Bar
            dataKey="planned"
            name="Planned"
            fill="hsl(var(--muted-foreground))"
            fillOpacity={0.28}
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill={chartColors.accent}
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
