import { RequirePermission } from '@/components/auth/RequirePermission';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DASHBOARD_MODULES } from '@/lib/modules';

/**
 * Staff area: open to anyone holding at least one module permission. Full-screen app layout:
 * a fixed-height sidebar with the content scrolling beside it (stacked on phones).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={DASHBOARD_MODULES.map((m) => m.permission)}>
      <div className="flex min-h-screen flex-col bg-surface md:h-dvh md:flex-row">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 px-5 py-6 md:overflow-y-auto md:px-10 md:py-9 xl:px-14">
          {children}
        </main>
      </div>
    </RequirePermission>
  );
}
