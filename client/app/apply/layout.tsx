import { RequirePermission } from '@/components/auth/RequirePermission';
import { AppHeader } from '@/components/layout/AppHeader';
import { PERMISSIONS } from '@/lib/permissions';

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={[PERMISSIONS.APPLICATION_MANAGE_OWN]}>
      <AppHeader homeHref="/apply" />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </RequirePermission>
  );
}
