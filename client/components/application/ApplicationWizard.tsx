'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { borrowerApi } from '@/lib/borrowerApi';
import type { ApplicationState, ApplicationStep } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LoanSummaryCard } from '@/components/loans/LoanSummaryCard';
import { DetailsStep } from './DetailsStep';
import { LoanStep } from './LoanStep';
import { Stepper } from './Stepper';
import { UploadStep } from './UploadStep';

/** Stepper index for each step (index 0, "Account", is already done once signed in). */
const STEP_INDEX: Record<ApplicationStep, number> = {
  DETAILS: 1,
  UPLOAD: 2,
  CONFIGURE: 3,
  SUBMITTED: 4,
};

const STEP_COPY: Record<Exclude<ApplicationStep, 'SUBMITTED'>, { title: string; text: string }> = {
  DETAILS: {
    title: 'Your details',
    text: 'We check your eligibility instantly. You need to be 23–50, earn at least ₹25,000 a month and be salaried or self-employed.',
  },
  UPLOAD: {
    title: 'Upload your salary slip',
    text: 'Your most recent slip, so our team can verify your income.',
  },
  CONFIGURE: {
    title: 'Choose your loan',
    text: 'Pick an amount and tenure. Interest is a fixed 12% per year, simple interest.',
  },
};

/**
 * The borrower's multi-step application. Loads saved progress from the server, so a refresh
 * or a return visit opens at the right step with earlier answers filled in.
 */
export function ApplicationWizard() {
  const [state, setState] = useState<ApplicationState | null>(null);
  const [step, setStep] = useState<ApplicationStep>('DETAILS');
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await borrowerApi.getApplication();
      setState(data);
      setStep(data.nextStep);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your application.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loadError) {
    return (
      <div className="space-y-3">
        <Alert>{loadError}</Alert>
        <Button variant="secondary" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center gap-3 py-16 text-muted">
        <Spinner /> Loading your application…
      </div>
    );
  }

  if (step === 'SUBMITTED' && state.activeLoan) {
    return (
      <div className="space-y-6">
        <Stepper current={STEP_INDEX.SUBMITTED} />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Application submitted</h1>
          <p className="text-sm text-muted">
            We&apos;ll review it shortly. You can follow its progress on this page or under My
            loans.
          </p>
        </div>
        <LoanSummaryCard loan={state.activeLoan} />
        <Link
          href="/my-loans"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          View all my loans
        </Link>
      </div>
    );
  }

  const copy = STEP_COPY[step === 'SUBMITTED' ? 'DETAILS' : step];

  return (
    <div className="space-y-8">
      <Stepper current={STEP_INDEX[step]} />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="text-sm text-muted">{copy.text}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {step === 'DETAILS' && (
          <DetailsStep
            profile={state.profile}
            onEligible={(profile) => {
              setState((s) => s && { ...s, profile });
              setStep(profile.salarySlip ? 'CONFIGURE' : 'UPLOAD');
            }}
          />
        )}
        {step === 'UPLOAD' && (
          <UploadStep
            current={state.profile?.salarySlip ?? null}
            onUploaded={(salarySlip) =>
              setState((s) => (s?.profile ? { ...s, profile: { ...s.profile, salarySlip } } : s))
            }
            onBack={() => setStep('DETAILS')}
            onContinue={() => setStep('CONFIGURE')}
          />
        )}
        {step === 'CONFIGURE' && (
          <LoanStep
            onBack={() => setStep('UPLOAD')}
            onApplied={(loan) => {
              setState((s) => s && { ...s, activeLoan: loan });
              setStep('SUBMITTED');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>
    </div>
  );
}
