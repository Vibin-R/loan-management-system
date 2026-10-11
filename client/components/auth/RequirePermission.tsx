'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Permission } from '@/lib/permissions';
import { FullPageLoader } from '@/components/ui/Spinner';
import { NoAccess } from './NoAccess';

interface RequirePermissionProps {
  /** The user needs at least one of these. */
  anyOf: Permission[];
  children: React.ReactNode;
}

/**
 * Guards a page or layout. Logged-out users go to /login (and come back afterwards);
 * logged-in users without the permission see a "No access" screen.
 * This only shapes the UI. Every API route checks the same permission on the server.
 */
export function RequirePermission({ anyOf, children }: RequirePermissionProps) {
  const { status, signedOutByUser, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'anonymous') return;
    // After a deliberate logout there is nothing to come back to.
    router.replace(signedOutByUser ? '/login' : `/login?next=${encodeURIComponent(pathname)}`);
  }, [status, signedOutByUser, router, pathname]);

  if (status !== 'authenticated') return <FullPageLoader />;
  if (!anyOf.some(can)) return <NoAccess />;
  return <>{children}</>;
}
