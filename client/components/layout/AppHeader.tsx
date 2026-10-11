'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

interface HeaderLink {
  href: string;
  label: string;
}

interface AppHeaderProps {
  homeHref: string;
  /** Optional top-level links, e.g. the borrower's Application and My loans. */
  links?: HeaderLink[];
}

/** Top bar shared by the borrower portal and the dashboard. */
export function AppHeader({ homeHref, links = [] }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link
            href={homeHref}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-[11px] font-bold text-white"
            >
              L
            </span>
            <span className="hidden sm:inline">LMS</span>
          </Link>
          {links.length > 0 && (
            <nav aria-label="Main" className="flex gap-0.5 sm:gap-1">
              {links.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm transition-colors sm:px-3 ${
                      active
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        {user && (
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.roles.join(', ')}</p>
            </div>
            <Button variant="secondary" onClick={logout} className="whitespace-nowrap px-3 py-1.5">
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
