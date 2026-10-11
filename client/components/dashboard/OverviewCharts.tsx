'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { operationsApi } from '@/lib/operationsApi';
import type { OverviewStats } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ACTIVITY_LEGEND, ActivityChart } from './charts/ActivityChart';
import { CollectionsChart } from './charts/CollectionsChart';
import { PipelineChart } from './charts/PipelineChart';

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

const RangeChip = ({ days }: { days: number }) => (
  <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted">
    Last {days} days
  </span>
);

/** Activity trend, loan pipeline and collections, from GET /stats/overview. */
export function OverviewCharts() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStats(await operationsApi.overviewStats());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the charts.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-3">
        <Alert>{error}</Alert>
        <Button variant="secondary" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading charts">
        <div className="h-72 animate-pulse rounded-2xl bg-background" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-background" />
          <div className="h-56 animate-pulse rounded-2xl bg-background" />
        </div>
      </div>
    );
  }

  const days = stats.daily.length;

  return (
    <div className="animate-fade-in space-y-12">
      <Section
        title="Activity"
        aside={
          <div className="flex flex-wrap items-center gap-4">
            {ACTIVITY_LEGEND.map((s) => (
              <span key={s.key} className="flex items-center gap-2 text-sm text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
            <RangeChip days={days} />
          </div>
        }
      >
        <ActivityChart daily={stats.daily} />
      </Section>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
        <Section title="Loan pipeline">
          <PipelineChart counts={stats.statusCounts} />
        </Section>

        <Section title="Collections" aside={<RangeChip days={days} />}>
          <dl className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total disbursed', value: stats.amounts.disbursed },
              { label: 'Total collected', value: stats.amounts.collected },
              { label: 'Outstanding now', value: stats.amounts.outstanding },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd className="truncate text-sm font-semibold tabular-nums sm:text-base">
                  {formatINR(item.value)}
                </dd>
              </div>
            ))}
          </dl>
          <CollectionsChart daily={stats.daily} />
        </Section>
      </div>
    </div>
  );
}
