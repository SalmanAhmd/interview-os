import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChartEmpty, ChartFrame, ChartTooltip, chartColors } from './chart-utils';

function shortName(name: string): string {
  return name
    .replace('Frontend System Design', 'System design')
    .replace('Data Structures & Algorithms', 'DSA')
    .replace('Browser & Web Fundamentals', 'Web fundamentals');
}

export function SkillProficiencyChart({
  data,
}: {
  data: { name: string; score: number; topics: number }[];
}) {
  return (
    <ChartFrame
      title="Technical proficiency"
      description="Average confidence by skill area"
      height={270}
    >
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data.map((item) => ({ ...item, label: shortName(item.name) }))} outerRadius="72%">
            <PolarGrid stroke={chartColors.grid} />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<ChartTooltip formatter={(value) => `${value}%`} />} />
            <Radar
              name="Proficiency"
              dataKey="score"
              stroke={chartColors.accent}
              strokeWidth={1.5}
              fill={chartColors.accent}
              fillOpacity={0.18}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty message="Add technical topics to visualise your confidence across skill areas." />
      )}
    </ChartFrame>
  );
}
