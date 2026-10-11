'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getHomePath } from '@/lib/modules';

export function NoAccess() {
  const { can } = useAuth();
  const home = getHomePath(can);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-danger">403 · No access</p>
      <h1 className="text-2xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="max-w-md text-sm text-muted">
        Your role doesn&apos;t include permission for this section. If you think this is wrong, ask
        an administrator to update your role.
      </p>
      {home !== '/no-access' && (
        <Link href={home} className="text-sm font-medium text-primary hover:underline">
          Go to your home page
        </Link>
      )}
    </div>
  );
}
