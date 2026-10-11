'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { borrowerApi } from '@/lib/borrowerApi';
import type { Loan } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoanSummaryCard } from './LoanSummaryCard';

/** All of the borrower's loans, newest first, each with its status timeline. */
export function MyLoans() {
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLoans((await borrowerApi.listMyLoans()).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your loans.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasActiveLoan = loans?.some((loan) =>
    ['APPLIED', 'SANCTIONED', 'DISBURSED'].includes(loan.status),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="My loans"
        subtitle="Track each application from review to repayment."
        actions={
          loans &&
          !hasActiveLoan && (
            <Link
              href="/apply"
              className="mr-2 rounded-md bg-gradient-to-r from-primary to-primary-strong px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Apply for a loan
            </Link>
          )
        }
      />

      {error && (
        <div className="space-y-3">
          <Alert>{error}</Alert>
          <Button variant="secondary" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}

      {!loans && !error && (
        <div className="flex items-center gap-3 py-16 text-muted">
          <Spinner /> Loading your loans…
        </div>
      )}

      {loans?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="font-medium">No loans yet</p>
          <p className="mt-1 text-sm text-muted">
            Check your eligibility and apply in a few minutes.
          </p>
        </div>
      )}

      {loans?.map((loan) => (
        <LoanSummaryCard key={loan.id} loan={loan} />
      ))}
    </div>
  );
}
