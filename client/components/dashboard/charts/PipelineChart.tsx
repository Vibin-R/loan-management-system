'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { LoanStatus, OverviewStats } from '@/lib/types';
import { STATUS_LABELS } from '@/components/loans/StatusBadge';
import { CHART_COLORS } from './chartTheme';
import { ChartTooltipCard } from './ChartTooltip';

const STATUS_COLORS: Record<LoanStatus, string> = {
  APPLIED: CHART_COLORS.blue,
  SANCTIONED: CHART_COLORS.orange,
  DISBURSED: CHART_COLORS.green,
  CLOSED: CHART_COLORS.grey,
  REJECTED: CHART_COLORS.red,
};

/** Donut of all loans by status, with a legend showing each count. */
export function PipelineChart({ counts }: { counts: OverviewStats['statusCounts'] }) {
  const data = (Object.keys(STATUS_COLORS) as LoanStatus[]).map((status) => ({
    status,
    name: STATUS_LABELS[status],
    value: counts[status] ?? 0,
  }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total > 0 ? data : [{ status: 'NONE', name: 'No loans', value: 1 }]}
              dataKey="value"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={total > 0 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {total > 0
                ? data.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status]} />)
                : [<Cell key="none" fill={CHART_COLORS.grid} />]}
            </Pie>
            {total > 0 && (
              <Tooltip
                content={({ active, payload }) => {
                  const item = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  return active && item ? (
                    <ChartTooltipCard
                      title={item.name}
                      rows={[
                        {
                          label: 'Loans',
                          value: `${item.value} (${Math.round((item.value / total) * 100)}%)`,
                          color: STATUS_COLORS[item.status],
                        },
                      ]}
                    />
                  ) : null;
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-xs text-muted">loans</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[d.status] }}
              />
              {d.name}
            </span>
            <span className="font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
