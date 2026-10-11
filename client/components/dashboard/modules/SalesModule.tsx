'use client';

import { useCallback, useState } from 'react';
import { operationsApi } from '@/lib/operationsApi';
import type { Lead, LeadStage, ListParams } from '@/lib/types';
import { usePaginatedList } from '@/lib/usePaginatedList';
import { QueueView } from '../QueueView';
import { LeadRow } from './LeadRow';

const STAGES: { value: LeadStage | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'REGISTERED', label: 'Signed up' },
  { value: 'BRE_FAILED', label: 'Not eligible' },
  { value: 'ELIGIBLE', label: 'Eligible, not applied' },
];

/** Lead tracking: borrowers who registered but haven't applied, with how far they got. */
export function SalesModule() {
  const [stage, setStage] = useState<LeadStage | ''>('');
  const fetchPage = useCallback(
    (params: ListParams) => operationsApi.listLeads({ ...params, stage: stage || undefined }),
    [stage],
  );
  const list = usePaginatedList(fetchPage, stage);
  /** One lead open at a time, like an accordion. */
  const [openId, setOpenId] = useState<string | null>(null);

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
        <LeadRow
          lead={lead}
          open={openId === lead.id}
          onToggle={() => setOpenId((id) => (id === lead.id ? null : lead.id))}
        />
      )}
    />
  );
}
