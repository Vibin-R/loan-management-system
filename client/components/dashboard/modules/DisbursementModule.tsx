'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { useSubmitError } from '@/lib/formErrors';
import { operationsApi } from '@/lib/operationsApi';
import { useToast } from '@/lib/toast';
import type { Loan } from '@/lib/types';
import { usePaginatedList } from '@/lib/usePaginatedList';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoanQueueCard } from '../LoanQueueCard';
import { QueueView } from '../QueueView';

/** Sanctioned loans waiting for funds to be released. */
export function DisbursementModule() {
  const list = usePaginatedList(operationsApi.listSanctioned);
  const [confirming, setConfirming] = useState<Loan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const showSubmitError = useSubmitError();

  const close = () => setConfirming(null);

  async function disburse() {
    if (!confirming) return;
    setSubmitting(true);
    try {
      await operationsApi.disburse(confirming.id);
      toast(`Disbursed ${formatINR(confirming.principal)} to ${confirming.applicant.fullName}`);
      close();
      void list.reload();
    } catch (err) {
      showSubmitError(err, { fallback: 'Could not disburse. Try again.' });
      // Someone else already moved this loan: close and refresh so the queue is current.
      if (err instanceof ApiError && err.status === 409) {
        close();
        void list.reload();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <QueueView
        list={list}
        searchPlaceholder="Search by name, email or PAN"
        emptyTitle="Nothing to disburse"
        emptyText="Loans approved by the sanction team will appear here."
        itemKey={(loan: Loan) => loan.id}
        renderItem={(loan: Loan) => (
          <LoanQueueCard
            loan={loan}
            actions={<Button onClick={() => setConfirming(loan)}>Disburse</Button>}
          />
        )}
      />
      <Modal
        open={confirming !== null}
        title="Release funds?"
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void disburse()} loading={submitting}>
              Disburse {confirming ? formatINR(confirming.principal) : ''}
            </Button>
          </>
        }
      >
        {confirming && (
          <div className="space-y-3">
            <p className="text-sm">
              Disburse <strong>{formatINR(confirming.principal)}</strong> to{' '}
              <strong>{confirming.applicant.fullName}</strong>? The loan moves to Collection, where{' '}
              {formatINR(confirming.totalRepayment)} is due over {confirming.tenureDays} days.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
