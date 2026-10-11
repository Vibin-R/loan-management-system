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
    <main className="flex min-h-screen bg-backdrop lg:h-screen lg:items-center lg:justify-center">
      {/* On desktop the card is capped at 80vw × 90vh so the page itself never scrolls. */}
      <div className="flex w-full overflow-hidden bg-surface lg:h-[90vh] lg:max-w-[80vw] lg:rounded-[2rem] lg:bg-ink lg:shadow-2xl">
        <AuthShowcase />

        <section className="relative z-10 flex flex-1 flex-col bg-surface px-6 py-6 sm:px-10 lg:-ml-8 lg:overflow-y-auto lg:rounded-[2rem] lg:px-12 lg:py-6 short:py-4">
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

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8 lg:py-4 short:py-2">
            <h1 className="text-3xl font-medium tracking-tight xl:text-4xl short:text-2xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
            <div className="mt-6 short:mt-4">{children}</div>
          </div>

          <footer className="text-xs text-muted tiny:hidden">
            © {new Date().getFullYear()} Loan Management System
          </footer>
        </section>
      </div>
    </main>
  );
}
