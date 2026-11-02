import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartEmpty, ChartFrame, ChartTooltip, axisProps, chartColors } from './chart-utils';

export function InterviewPerformanceChart({
  data,
  average,
}: {
  data: { label: string; score: number; type: string }[];
  average: number;
}) {
  return (
    <ChartFrame
      title="Interview performance"
      description={
        data.length
          ? `Mock score trend · ${average.toFixed(1)}/10 average`
          : 'Mock interview scores over time'
      }
      height={250}
    >
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 14, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chartColors.grid} strokeOpacity={0.7} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} {...axisProps} width={40} />
            <Tooltip
              content={
                <ChartTooltip formatter={(value) => `${Number(value).toFixed(1)}/10`} />
              }
            />
            <ReferenceLine
              y={7}
              stroke={chartColors.success}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Score"
              stroke={chartColors.accent}
              strokeWidth={2}
              dot={{ r: 3, fill: chartColors.accent, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmpty message="Log mock interviews to track your score trend and interview readiness." />
      )}
    </ChartFrame>
  );
}
