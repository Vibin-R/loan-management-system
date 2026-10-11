'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';

/** Top bar shared by the borrower portal and the dashboard. */
export function AppHeader({ homeHref }: { homeHref: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={homeHref} className="text-sm font-semibold tracking-tight">
          LMS <span className="font-normal text-muted">· Loan Management</span>
        </Link>
        {user && (
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.roles.join(', ')}</p>
            </div>
            <Button variant="secondary" onClick={logout} className="px-3 py-1.5">
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
