'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDayMonth } from '@/lib/format';
import type { OverviewStats } from '@/lib/types';
import { AXIS_PROPS, CHART_COLORS } from './chartTheme';
import { ChartTooltipCard } from './ChartTooltip';

const SERIES = [
  { key: 'applications', label: 'Applications', color: CHART_COLORS.blue },
  { key: 'disbursals', label: 'Disbursals', color: CHART_COLORS.orange },
] as const;

/** Daily applications vs disbursals: how fast loans move from request to money out. */
export function ActivityChart({ daily }: { daily: OverviewStats['daily'] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayMonth}
            interval="preserveStartEnd"
            minTickGap={24}
            {...AXIS_PROPS}
          />
          <YAxis allowDecimals={false} width={48} {...AXIS_PROPS} />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.axis, strokeDasharray: '4 4' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltipCard
                  title={formatDayMonth(String(label))}
                  rows={SERIES.map((s) => ({
                    label: s.label,
                    color: s.color,
                    value: String(payload.find((p) => p.dataKey === s.key)?.value ?? 0),
                  }))}
                />
              ) : null
            }
          />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#fill-${s.key})`}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const ACTIVITY_LEGEND = SERIES;
