'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getHomePath } from '@/lib/modules';
import { FullPageLoader } from '@/components/ui/Spinner';

/** Landing page for visitors; signed-in users go straight to their home page. */
export default function HomePage() {
  const { status, can } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace(getHomePath(can));
  }, [status, can, router]);

  if (status !== 'anonymous') return <FullPageLoader />;

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
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
