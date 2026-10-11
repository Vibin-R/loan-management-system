'use client';

import { NoAccess } from '@/components/auth/NoAccess';
import { AppHeader } from '@/components/layout/AppHeader';

/** For signed-in users whose roles grant no page at all. */
export default function NoAccessPage() {
  return (
    <>
      <AppHeader homeHref="/" />
      <NoAccess />
    </>
  );
}
