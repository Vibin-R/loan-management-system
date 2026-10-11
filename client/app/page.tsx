import Link from 'next/link';

/** Temporary landing page. Phase 03 replaces this with a redirect to the user's home by permission. */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Loan Management System</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Personal loans from ₹50,000 to ₹5,00,000
        </h1>
        <p className="text-muted">
          Check your eligibility in a minute, upload your salary slip and choose your amount and
          tenure. Interest is a fixed 12% per year.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Apply for a loan
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
