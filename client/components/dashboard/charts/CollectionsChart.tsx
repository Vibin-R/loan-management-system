'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDayMonth, formatINR, formatINRCompact } from '@/lib/format';
import type { OverviewStats } from '@/lib/types';
import { AXIS_PROPS, CHART_COLORS } from './chartTheme';
import { ChartTooltipCard } from './ChartTooltip';

/** Repayments received per day. */
export function CollectionsChart({ daily }: { daily: OverviewStats['daily'] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={daily} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayMonth}
            interval="preserveStartEnd"
            minTickGap={24}
            {...AXIS_PROPS}
          />
          <YAxis tickFormatter={formatINRCompact} width={56} {...AXIS_PROPS} />
          <Tooltip
            cursor={{ fill: CHART_COLORS.grid }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltipCard
                  title={formatDayMonth(String(label))}
                  rows={[
                    {
                      label: 'Collected',
                      value: formatINR(Number(payload[0]?.value ?? 0)),
                      color: CHART_COLORS.green,
                    },
                  ]}
                />
              ) : null
            }
          />
          <Bar
            dataKey="collected"
            fill={CHART_COLORS.green}
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
