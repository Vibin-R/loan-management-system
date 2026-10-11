'use client';

import { useCallback, useState } from 'react';
import { EMPLOYMENT_OPTIONS } from '@/lib/bre';
import { formatDate, formatINRWhole } from '@/lib/format';
import { operationsApi } from '@/lib/operationsApi';
import type { Lead, LeadStage, ListParams } from '@/lib/types';
import { usePaginatedList } from '@/lib/usePaginatedList';
import { QueueView } from '../QueueView';

const STAGES: { value: LeadStage | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'REGISTERED', label: 'Signed up' },
  { value: 'BRE_FAILED', label: 'Not eligible' },
  { value: 'ELIGIBLE', label: 'Eligible, not applied' },
];

const STAGE_BADGE: Record<LeadStage, { label: string; className: string }> = {
  REGISTERED: { label: 'Signed up', className: 'bg-background text-muted' },
  BRE_FAILED: { label: 'Not eligible', className: 'bg-danger/10 text-danger' },
  ELIGIBLE: { label: 'Eligible, not applied', className: 'bg-success/10 text-success' },
};

const employmentLabel = (mode: string) =>
  EMPLOYMENT_OPTIONS.find((o) => o.value === mode)?.label ?? mode;

/** Lead tracking: borrowers who registered but haven't applied, with how far they got. */
export function SalesModule() {
  const [stage, setStage] = useState<LeadStage | ''>('');
  const fetchPage = useCallback(
    (params: ListParams) => operationsApi.listLeads({ ...params, stage: stage || undefined }),
    [stage],
  );
  const list = usePaginatedList(fetchPage, stage);

  return (
    <QueueView
      list={list}
      searchPlaceholder="Search by name or email"
      emptyTitle="No open leads"
      emptyText="Borrowers who sign up but haven't applied will appear here."
      itemKey={(lead: Lead) => lead.id}
      toolbar={
        <div role="group" aria-label="Filter by stage" className="flex flex-wrap gap-1">
          {STAGES.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={stage === option.value}
              onClick={() => setStage(option.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                stage === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-muted hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
      renderItem={(lead: Lead) => (
        <article className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-medium">{lead.name}</h3>
              <p className="truncate text-sm text-muted">{lead.email}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_BADGE[lead.stage].className}`}
            >
              {STAGE_BADGE[lead.stage].label}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Signed up {formatDate(lead.signedUpAt)}
            {lead.profile && (
              <>
                {' '}
                · <span className="font-mono">{lead.profile.pan}</span> ·{' '}
                {formatINRWhole(lead.profile.monthlySalary)}/month ·{' '}
                {employmentLabel(lead.profile.employmentMode)}
              </>
            )}
          </p>
          {lead.profile && lead.profile.breFailures.length > 0 && (
            <p className="mt-2 text-sm text-danger">{lead.profile.breFailures.join(' ')}</p>
          )}
        </article>
      )}
    />
  );
}
