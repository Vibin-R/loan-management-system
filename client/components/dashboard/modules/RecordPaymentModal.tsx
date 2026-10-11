'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/format';
import { useSubmitError } from '@/lib/formErrors';
import { operationsApi } from '@/lib/operationsApi';
import type { Loan, Payment } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { DateField } from '@/components/ui/DateField';
import { TextField } from '@/components/ui/TextField';

interface RecordPaymentModalProps {
  loan: Loan | null;
  onClose: () => void;
  /** Called after a payment is saved, with the updated loan. */
  onRecorded: (loan: Loan) => void;
}

type Field = 'utr' | 'amount' | 'paidOn';
const FIELDS: readonly Field[] = ['utr', 'amount', 'paidOn'];

/** Today's date in India as YYYY-MM-DD, the default payment date. */
const todayIST = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

function validate(values: Record<Field, string>, outstanding: number) {
  const errors: Partial<Record<Field, string>> = {};
  if (!/^[A-Za-z0-9]{6,30}$/.test(values.utr.trim()))
    errors.utr = 'UTR must be 6–30 letters or digits';
  const amount = Number(values.amount);
  if (!values.amount || amount <= 0) errors.amount = 'Enter an amount greater than zero';
  else if (Math.round(amount * 100) !== amount * 100)
    errors.amount = 'Use at most 2 decimal places';
  else if (amount > outstanding)
    errors.amount = `Cannot be more than ${formatINR(outstanding)} outstanding`;
  if (!values.paidOn) errors.paidOn = 'Choose the payment date';
  else if (values.paidOn > todayIST()) errors.paidOn = 'Payment date cannot be in the future';
  return errors;
}

/** Collection: record a repayment (UTR, amount, date) and see the loan's payment history. */
export function RecordPaymentModal({ loan, onClose, onRecorded }: RecordPaymentModalProps) {
  const [values, setValues] = useState<Record<Field, string>>({
    utr: '',
    amount: '',
    paidOn: todayIST(),
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showSubmitError = useSubmitError();

  const loadHistory = useCallback(async (loanId: string) => {
    setPayments(null);
    setHistoryError(null);
    try {
      setPayments((await operationsApi.listPayments(loanId)).items);
    } catch (err) {
      setHistoryError(err instanceof ApiError ? err.message : 'Could not load payment history.');
    }
  }, []);

  useEffect(() => {
    if (!loan) return;
    setValues({ utr: '', amount: '', paidOn: todayIST() });
    setErrors({});
    void loadHistory(loan.id);
  }, [loan, loadHistory]);

  const update = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!loan) return;
    const found = validate(values, loan.outstanding);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const result = await operationsApi.recordPayment(loan.id, {
        utr: values.utr.trim().toUpperCase(),
        amount: Number(values.amount),
        paidOn: values.paidOn,
      });
      onRecorded(result.loan);
    } catch (err) {
      // Duplicate UTR, amount over outstanding and date problems show under their inputs.
      showSubmitError(err, {
        fields: FIELDS,
        setErrors,
        fallback: 'Could not record the payment.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const paidPercent = loan ? Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100) : 0;

  return (
    <Modal
      open={loan !== null}
      size="lg"
      title={loan ? `Record payment · ${loan.applicant.fullName}` : ''}
      onClose={onClose}
    >
      {loan && (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted">
                Paid {formatINR(loan.amountPaid)} of {formatINR(loan.totalRepayment)}
              </span>
              <span className="font-semibold">{formatINR(loan.outstanding)} outstanding</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="UTR number"
                value={values.utr}
                onChange={(e) => update('utr', e.target.value.toUpperCase())}
                className="font-mono uppercase"
                maxLength={30}
                error={errors.utr}
                autoFocus
              />
              <DateField
                label="Payment date"
                max={todayIST()}
                value={values.paidOn}
                onChange={(paidOn) => update('paidOn', paidOn)}
                error={errors.paidOn}
              />
            </div>
            <div className="space-y-1.5">
              <TextField
                label="Amount (₹)"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={values.amount}
                onChange={(e) => update('amount', e.target.value)}
                error={errors.amount}
              />
              <button
                type="button"
                onClick={() => update('amount', loan.outstanding.toFixed(2))}
                className="text-xs font-medium text-primary hover:underline"
              >
                Fill full outstanding ({formatINR(loan.outstanding)})
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Close
              </Button>
              <Button type="submit" loading={submitting}>
                Record payment
              </Button>
            </div>
          </form>

          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
              Payment history
            </h3>
            {historyError ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-danger">{historyError}</p>
                <Button variant="secondary" onClick={() => void loadHistory(loan.id)}>
                  Try again
                </Button>
              </div>
            ) : payments === null ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Spinner className="h-4 w-4" /> Loading…
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="font-mono">{payment.utr}</span>
                    <span className="text-muted">{formatDate(payment.paidOn)}</span>
                    <span className="font-medium tabular-nums">{formatINR(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
