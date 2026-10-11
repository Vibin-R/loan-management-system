import { RequirePermission } from '@/components/auth/RequirePermission';
import { AppHeader } from '@/components/layout/AppHeader';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { DASHBOARD_MODULES } from '@/lib/modules';

/** Staff area: open to anyone holding at least one module permission. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={DASHBOARD_MODULES.map((m) => m.permission)}>
      <AppHeader homeHref="/dashboard" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-48 md:shrink-0">
          <DashboardNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </RequirePermission>
  );
}
