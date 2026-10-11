import { RequirePermission } from '@/components/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/permissions';
import { AppHeader } from './AppHeader';

const BORROWER_LINKS = [
  { href: '/apply', label: 'Application' },
  { href: '/my-loans', label: 'My loans' },
];

/** Guard and chrome shared by every borrower page. */
export function BorrowerShell({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={[PERMISSIONS.APPLICATION_MANAGE_OWN]}>
      <AppHeader homeHref="/apply" links={BORROWER_LINKS} />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </RequirePermission>
  );
}
