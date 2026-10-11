'use client';

import { useState } from 'react';
import { operationsApi } from '@/lib/operationsApi';
import { useToast } from '@/lib/toast';
import type { Loan } from '@/lib/types';
import { usePaginatedList } from '@/lib/usePaginatedList';
import { Button } from '@/components/ui/Button';
import { LoanQueueCard } from '../LoanQueueCard';
import { QueueView } from '../QueueView';
import { ReviewLoanModal } from './ReviewLoanModal';

/** Applied loans waiting for a decision. */
export function SanctionModule() {
  const list = usePaginatedList(operationsApi.listApplied);
  const [reviewing, setReviewing] = useState<Loan | null>(null);
  const toast = useToast();

  return (
    <>
      <QueueView
        list={list}
        searchPlaceholder="Search by name, email or PAN"
        emptyTitle="No applications to review"
        emptyText="New loan applications will appear here."
        itemKey={(loan: Loan) => loan.id}
        renderItem={(loan: Loan) => (
          <LoanQueueCard
            loan={loan}
            actions={<Button onClick={() => setReviewing(loan)}>Review</Button>}
          />
        )}
      />
      <ReviewLoanModal
        loan={reviewing}
        onClose={() => setReviewing(null)}
        onDecided={(message) => {
          toast(message);
          void list.reload();
        }}
      />
    </>
  );
}
