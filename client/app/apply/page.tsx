import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your application' };

/** The multi-step application form is built in Phase 04. */
export default function ApplyPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Your loan application</h1>
      <p className="text-sm text-muted">
        Next: personal details and eligibility check, salary slip upload, then choose your loan.
      </p>
    </div>
  );
}
