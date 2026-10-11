'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatINRWhole } from '@/lib/format';
import { ANNUAL_INTEREST_RATE, LOAN_LIMITS } from '@/lib/loanMath';
import { getHomePath } from '@/lib/modules';
import { HeroIllustration } from '@/components/landing/HeroIllustration';
import {
  ArrowRightIcon,
  BanknoteIcon,
  ClipboardCheckIcon,
  FileTextIcon,
} from '@/components/ui/icons';
import { FullPageLoader } from '@/components/ui/Spinner';

const STEPS = [
  {
    Icon: ClipboardCheckIcon,
    title: 'Check eligibility',
    text: 'Enter a few details and get an instant answer.',
  },
  {
    Icon: FileTextIcon,
    title: 'Upload your salary slip',
    text: 'PDF, JPG or PNG. Our team verifies it quickly.',
  },
  {
    Icon: BanknoteIcon,
    title: 'Get your money',
    text: 'Once approved, funds are released and you repay over your chosen tenure.',
  },
];

const primaryLink =
  'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-strong px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110';
const secondaryLink =
  'inline-flex items-center rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium transition hover:border-primary/40 hover:text-primary';

/** Landing page for visitors; signed-in users go straight to their home page. */
export default function HomePage() {
  const { status, can } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace(getHomePath(can));
  }, [status, can, router]);

  if (status !== 'anonymous') return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-xs font-bold text-white"
          >
            L
          </span>
          LMS
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-surface transition hover:bg-foreground/85"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto px-5 pb-16 md:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#eef3ff] via-[#f5f8ff] to-[#e8efff] px-6 py-12 sm:px-10 md:py-16 lg:px-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">
                Loans up to {formatINRWhole(LOAN_LIMITS.maxPrincipal)}
              </p>
              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                The easiest place to <span className="text-primary">apply for your loan</span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted">
                Borrow {formatINRWhole(LOAN_LIMITS.minPrincipal)} to{' '}
                {formatINRWhole(LOAN_LIMITS.maxPrincipal)} for {LOAN_LIMITS.minTenureDays}–
                {LOAN_LIMITS.maxTenureDays} days at a fixed {ANNUAL_INTEREST_RATE}% a year. Check
                your eligibility in a minute and track every step online.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/signup" className={primaryLink}>
                  Apply for a loan
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="/login" className={secondaryLink}>
                  Log in
                </Link>
              </div>
              <dl className="flex flex-wrap gap-x-8 gap-y-3 pt-4">
                {[
                  { label: 'Interest', value: `${ANNUAL_INTEREST_RATE}% p.a.` },
                  {
                    label: 'Tenure',
                    value: `${LOAN_LIMITS.minTenureDays}–${LOAN_LIMITS.maxTenureDays} days`,
                  },
                  { label: 'Eligibility check', value: 'Instant' },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-muted">{item.label}</dt>
                    <dd className="text-sm font-semibold">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroIllustration className="mx-auto w-full max-w-md" />
          </div>
        </section>

        <section aria-labelledby="how-it-works" className="mt-14 space-y-6">
          <h2 id="how-it-works" className="text-lg font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-border p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    <span className="text-muted">0{i + 1} · </span>
                    {title}
                  </p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
