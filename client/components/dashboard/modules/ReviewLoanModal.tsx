'use client';

import { useState } from 'react';
import { EMPLOYMENT_OPTIONS } from '@/lib/bre';
import { formatDate, formatFileSize, formatINR } from '@/lib/format';
import { useSubmitError } from '@/lib/formErrors';
import { operationsApi } from '@/lib/operationsApi';
import type { Loan } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField } from '@/components/ui/TextAreaField';

interface ReviewLoanModalProps {
  loan: Loan | null;
  onClose: () => void;
  /** Called after a successful approve/reject with a message for the toast. */
  onDecided: (message: string) => void;
}

const employmentLabel = (mode: string) =>
  EMPLOYMENT_OPTIONS.find((o) => o.value === mode)?.label ?? mode;

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

/** Sanction review: applicant details, salary slip, then Approve or Reject with a reason. */
export function ReviewLoanModal({ loan, onClose, onDecided }: ReviewLoanModalProps) {
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();
  const showSubmitError = useSubmitError();
  const [busy, setBusy] = useState<'approve' | 'reject' | 'slip' | null>(null);

  const close = () => {
    setMode('review');
    setReason('');
    setReasonError(undefined);
    onClose();
  };

  async function run(action: 'approve' | 'reject') {
    if (!loan) return;
    if (action === 'reject' && reason.trim().length < 5) {
      setReasonError('Give a reason of at least 5 characters');
      return;
    }
    setBusy(action);
    try {
      if (action === 'approve') await operationsApi.approve(loan.id);
      else await operationsApi.reject(loan.id, reason.trim());
      const name = loan.applicant.fullName;
      close();
      onDecided(action === 'approve' ? `Approved loan for ${name}` : `Rejected loan for ${name}`);
    } catch (err) {
      showSubmitError(err, {
        fields: ['reason'],
        setErrors: (errors) => setReasonError(errors.reason),
        fallback: 'Something went wrong. Try again.',
      });
    } finally {
      setBusy(null);
    }
  }

  async function openSlip() {
    if (!loan) return;
    setBusy('slip');
    try {
      const blob = await operationsApi.salarySlip(loan.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      showSubmitError(err, { fallback: 'Could not open the salary slip.' });
    } finally {
      setBusy(null);
    }
  }

  if (!loan)
    return (
      <Modal open={false} title="" onClose={close}>
        {null}
      </Modal>
    );

  const { applicant } = loan;

  return (
    <Modal
      open
      size="lg"
      title={
        mode === 'reject' ? `Reject ${applicant.fullName}'s application` : 'Review application'
      }
      description={`Applied ${formatDate(loan.createdAt)}`}
      onClose={close}
      footer={
        mode === 'review' ? (
          <>
            <Button variant="secondary" onClick={() => setMode('reject')} disabled={busy !== null}>
              Reject
            </Button>
            <Button onClick={() => void run('approve')} loading={busy === 'approve'}>
              Approve {formatINR(loan.principal)}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setMode('review')} disabled={busy !== null}>
              Back
            </Button>
            <Button variant="danger" onClick={() => void run('reject')} loading={busy === 'reject'}>
              Reject application
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {mode === 'review' ? (
          <>
            <section className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Applicant</h3>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Detail label="Name" value={applicant.fullName} />
                <Detail label="PAN" value={<span className="font-mono">{applicant.pan}</span>} />
                <Detail label="Age at application" value={`${applicant.ageAtApplication} years`} />
                <Detail label="Monthly salary" value={formatINR(applicant.monthlySalary)} />
                <Detail label="Employment" value={employmentLabel(applicant.employmentMode)} />
                <Detail
                  label="Email"
                  value={<span className="break-all">{applicant.email}</span>}
                />
              </dl>
              <p className="rounded-lg bg-success/5 px-3 py-2 text-sm text-success">
                Passed all eligibility checks (age, salary, PAN, employment).
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Loan</h3>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Detail label="Amount" value={formatINR(loan.principal)} />
                <Detail label="Tenure" value={`${loan.tenureDays} days`} />
                <Detail label="Interest" value={formatINR(loan.interest)} />
                <Detail label="Total repayment" value={formatINR(loan.totalRepayment)} />
              </dl>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{loan.salarySlip.originalName}</p>
                <p className="text-xs text-muted">
                  Salary slip · {formatFileSize(loan.salarySlip.size)}
                </p>
              </div>
              <Button variant="secondary" onClick={() => void openSlip()} loading={busy === 'slip'}>
                View salary slip
              </Button>
            </section>
          </>
        ) : (
          <TextAreaField
            label="Reason for rejection"
            hint="The applicant will see this reason."
            value={reason}
            maxLength={500}
            autoFocus
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(undefined);
            }}
            error={reasonError}
          />
        )}
      </div>
    </Modal>
  );
}
