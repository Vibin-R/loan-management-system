'use client';

import { useState } from 'react';
import { formatINR } from '@/lib/format';
import { operationsApi } from '@/lib/operationsApi';
import { useToast } from '@/lib/toast';
import type { Loan } from '@/lib/types';
import { usePaginatedList } from '@/lib/usePaginatedList';
import { Button } from '@/components/ui/Button';
import { LoanQueueCard } from '../LoanQueueCard';
import { QueueView } from '../QueueView';
import { RecordPaymentModal } from './RecordPaymentModal';

/** Disbursed loans being repaid. A loan leaves this queue automatically once fully paid. */
export function CollectionModule() {
  const list = usePaginatedList(operationsApi.listDisbursed);
  const [active, setActive] = useState<Loan | null>(null);
  const toast = useToast();

  return (
    <>
      <QueueView
        list={list}
        searchPlaceholder="Search by name, email or PAN"
        emptyTitle="No active loans"
        emptyText="Disbursed loans appear here until they are fully repaid."
        itemKey={(loan: Loan) => loan.id}
        renderItem={(loan: Loan) => {
          const paidPercent = Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100);
          return (
            <LoanQueueCard
              loan={loan}
              actions={<Button onClick={() => setActive(loan)}>Record payment</Button>}
            >
              <div className="max-w-md space-y-1 pt-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${paidPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted">
                  Paid {formatINR(loan.amountPaid)} ·{' '}
                  <span className="font-medium text-foreground">
                    {formatINR(loan.outstanding)} outstanding
                  </span>
                </p>
              </div>
            </LoanQueueCard>
          );
        }}
      />
      <RecordPaymentModal
        loan={active}
        onClose={() => setActive(null)}
        onRecorded={(loan) => {
          if (loan.status === 'CLOSED') {
            toast(`Fully repaid. Loan for ${loan.applicant.fullName} is now closed.`);
            setActive(null);
          } else {
            toast(`Payment recorded. ${formatINR(loan.outstanding)} still outstanding.`);
            setActive(loan); // keep the dialog open with the updated balance and history
          }
          void list.reload();
        }}
      />
    </>
  );
}
