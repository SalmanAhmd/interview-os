import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InterviewPipelineItem } from '../../types';
import { ChartEmpty, ChartFrame, ChartTooltip, axisProps, chartColors } from './chart-utils';

export function ApplicationFunnelChart({ data }: { data: InterviewPipelineItem[] }) {
  const active = data.filter((item) => item.count > 0);

  return (
    <ChartFrame
      title="Application funnel"
      description="Live applications by pipeline stage"
      height={248}
    >
      {active.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={active}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 4, bottom: 0 }}
            barCategoryGap={8}
          >
            <CartesianGrid horizontal={false} stroke={chartColors.grid} strokeOpacity={0.7} />
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="stage"
              width={116}
              {...axisProps}
              tick={{ ...axisProps.tick, fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
              content={<ChartTooltip />}
            />
            <Bar dataKey="count" name="Applications" fill={chartColors.accent} radius={[0, 4, 4, 0]} barSize={11}>
              <LabelList
                dataKey="count"
                position="right"
                style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty message="Add applications to see your pipeline conversion funnel." />
      )}
    </ChartFrame>
  );
}
