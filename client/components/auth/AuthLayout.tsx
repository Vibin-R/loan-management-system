import Link from 'next/link';
import { AuthShowcase } from './AuthShowcase';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  /** Link in the top-right corner to the other auth page. */
  switchTo: { label: string; href: string; icon: React.ReactNode };
  children: React.ReactNode;
}

/**
 * Split-screen layout for login and signup: a dark brand panel on the left and the form on a
 * white panel that overlaps it. On small screens only the form panel is shown.
 */
export function AuthLayout({ title, subtitle, switchTo, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen bg-backdrop lg:p-6">
      <div className="mx-auto flex w-full max-w-6xl overflow-hidden bg-surface lg:min-h-[44rem] lg:rounded-[2rem] lg:bg-ink lg:shadow-2xl">
        <AuthShowcase />

        <section className="relative z-10 flex flex-1 flex-col bg-surface px-6 py-6 sm:px-10 lg:-ml-8 lg:rounded-[2rem] lg:px-14 lg:py-8">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-xs font-bold text-white"
              >
                L
              </span>
              LMS
            </Link>
            <Link
              href={switchTo.href}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
            >
              {switchTo.icon}
              {switchTo.label}
            </Link>
          </header>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 className="text-4xl font-medium tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>© {new Date().getFullYear()} Loan Management System</span>
            <span>Borrowers and staff use the same sign-in</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
