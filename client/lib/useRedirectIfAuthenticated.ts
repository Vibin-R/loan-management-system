'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './auth-context';
import { canAccessPath, getHomePath } from './modules';

/** Only same-site paths are allowed as a post-login destination (prevents open redirects). */
const isSafePath = (path: string | null): path is string =>
  !!path && path.startsWith('/') && !path.startsWith('//');

/**
 * Sends a signed-in user to `?next=` when it is safe and they can open it,
 * otherwise to their own home page.
 */
export function useRedirectIfAuthenticated(): void {
  const { status, can } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next');

  useEffect(() => {
    if (status !== 'authenticated') return;
    const useNext = isSafePath(next) && canAccessPath(next, can);
    router.replace(useNext ? next : getHomePath(can));
  }, [status, can, next, router]);
}
