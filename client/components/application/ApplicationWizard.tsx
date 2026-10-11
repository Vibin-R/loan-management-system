'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { borrowerApi } from '@/lib/borrowerApi';
import type { ApplicationState, ApplicationStep } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LoanSummaryCard } from '@/components/loans/LoanSummaryCard';
import { PageHeader } from '@/components/layout/PageHeader';
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
  const { user } = useAuth();
  const greeting = `Hello, ${user?.name.split(' ')[0] ?? ''}`;
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
      <div className="space-y-8">
        <PageHeader
          title="Application submitted"
          subtitle="We'll review it shortly. Follow its progress here or under My loans."
        />
        <Stepper current={STEP_INDEX.SUBMITTED} />
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

  // Which steps can be opened from the stepper: details always; upload once eligible;
  // loan choice once a slip is uploaded. "Account" (index 0) is never reopened.
  const reachable: Partial<Record<number, ApplicationStep>> = {
    1: 'DETAILS',
    ...(state.profile?.bre.passed ? { 2: 'UPLOAD' as const } : {}),
    ...(state.profile?.bre.passed && state.profile.salarySlip ? { 3: 'CONFIGURE' as const } : {}),
  };

  return (
    <div className="space-y-8">
      <PageHeader title={greeting} subtitle="Complete these steps to apply for a personal loan." />
      <Stepper
        current={STEP_INDEX[step]}
        canSelect={(i) => reachable[i] !== undefined}
        onSelect={(i) => {
          const target = reachable[i];
          if (target) setStep(target);
        }}
      />
      <div
        key={step}
        className="animate-fade-up space-y-6 rounded-2xl border border-border bg-surface p-5 sm:p-7"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{copy.title}</h2>
          <p className="text-sm text-muted">{copy.text}</p>
        </div>
        {step === 'DETAILS' && (
          <DetailsStep
            profile={state.profile}
            onEligible={(profile) => {
              setState((s) => s && { ...s, profile });
              setStep('UPLOAD'); // always the next step; an uploaded slip shows there
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
