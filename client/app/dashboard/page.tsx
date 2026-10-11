'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { allowedModules, type DashboardModule } from '@/lib/modules';
import { operationsApi } from '@/lib/operationsApi';
import { MODULE_ICONS } from '@/components/dashboard/moduleIcons';
import { OverviewCharts } from '@/components/dashboard/OverviewCharts';
import { PageHeader } from '@/components/layout/PageHeader';

type ModuleKey = DashboardModule['key'];

/** Each module's queue size, read from the list endpoints' `total` (one row fetched). */
const COUNT_QUEUE: Record<ModuleKey, () => Promise<{ total: number }>> = {
  sales: () => operationsApi.listLeads({ page: 1, limit: 1 }),
  sanction: () => operationsApi.listApplied({ page: 1, limit: 1 }),
  disbursement: () => operationsApi.listSanctioned({ page: 1, limit: 1 }),
  collection: () => operationsApi.listDisbursed({ page: 1, limit: 1 }),
};

/** Staff home: a greeting, queue counts for the user's modules, and links into each one. */
export default function DashboardHomePage() {
  const { user, can } = useAuth();
  const modules = allowedModules(can);
  const [counts, setCounts] = useState<Partial<Record<ModuleKey, number | null>>>({});

  const moduleKeys = modules.map((m) => m.key).join(',');
  useEffect(() => {
    let cancelled = false;
    for (const key of moduleKeys.split(',').filter(Boolean) as ModuleKey[]) {
      COUNT_QUEUE[key]()
        .then(({ total }) => !cancelled && setCounts((c) => ({ ...c, [key]: total })))
        .catch(() => !cancelled && setCounts((c) => ({ ...c, [key]: null })));
    }
    return () => {
      cancelled = true;
    };
  }, [moduleKeys]);

  const waiting = modules.reduce((sum, m) => sum + (counts[m.key] ?? 0), 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Hello, ${user?.name.split(' ')[0] ?? ''}`}
        subtitle={
          waiting > 0
            ? `${waiting} ${waiting === 1 ? 'item is' : 'items are'} waiting across your queues.`
            : 'Track your queues here and pick up where you left off.'
        }
      />

      <section
        aria-label="Queue summary"
        className="grid gap-x-6 border-y border-border py-2 sm:grid-cols-2 xl:grid-cols-4 xl:gap-x-0"
      >
        {modules.map((m) => {
          const Icon = MODULE_ICONS[m.key];
          const count = counts[m.key];
          return (
            <Link
              key={m.key}
              href={m.href}
              className="group flex items-center gap-4 py-4 xl:border-l xl:border-border xl:px-6 xl:first:border-l-0 xl:first:pl-0"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors group-hover:border-primary/40 group-hover:text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.label}</p>
                <p className="flex items-baseline gap-2">
                  <span
                    key={String(count)}
                    className="animate-fade-in text-xl font-semibold tabular-nums"
                  >
                    {count === undefined ? '…' : count === null ? '–' : count}
                  </span>
                  <span className="truncate text-xs text-muted">{m.countLabel}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <OverviewCharts />
    </div>
  );
}
