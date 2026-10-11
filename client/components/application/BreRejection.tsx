import type { BreFailure } from '@/lib/types';

/** Lists every eligibility rule the applicant failed, so they can fix them all at once. */
export function BreRejection({ failures }: { failures: BreFailure[] }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
      <p className="font-medium text-danger">You&apos;re not eligible for a loan yet</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
        {failures.map((failure) => (
          <li key={failure.rule}>{failure.message}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        If any detail was entered incorrectly, correct it below and check again.
      </p>
    </div>
  );
}
