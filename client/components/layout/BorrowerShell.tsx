'use client';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/permissions';
import { FileTextIcon, WalletIcon } from '@/components/ui/icons';
import { AppSidebar, type NavItem } from './AppSidebar';

const BORROWER_NAV: NavItem[] = [
  { href: '/apply', label: 'Application', Icon: FileTextIcon },
  { href: '/my-loans', label: 'My loans', Icon: WalletIcon },
];

/** Guard and chrome for every borrower page: same full-screen layout as the staff dashboard. */
export function BorrowerShell({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={[PERMISSIONS.APPLICATION_MANAGE_OWN]}>
      <div className="flex min-h-screen flex-col bg-surface md:h-dvh md:flex-row">
        <AppSidebar homeHref="/apply" items={BORROWER_NAV} />
        <main className="min-w-0 flex-1 px-5 py-6 md:overflow-y-auto md:px-10 md:py-9 xl:px-14">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </RequirePermission>
  );
}
