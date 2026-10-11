'use client';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { getModule, type DashboardModule } from '@/lib/modules';
import { PageHeader } from '@/components/layout/PageHeader';

interface ModulePageProps {
  moduleKey: DashboardModule['key'];
  children: React.ReactNode;
}

/** Guards a module page by its permission and renders its header. */
export function ModulePage({ moduleKey, children }: ModulePageProps) {
  const dashboardModule = getModule(moduleKey);

  return (
    <RequirePermission anyOf={[dashboardModule.permission]}>
      <div className="space-y-8">
        <PageHeader title={dashboardModule.label} subtitle={dashboardModule.description} />
        {children}
      </div>
    </RequirePermission>
  );
}
