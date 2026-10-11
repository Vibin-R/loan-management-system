'use client';

import { RequirePermission } from '@/components/auth/RequirePermission';
import { getModule, type DashboardModule } from '@/lib/modules';

interface ModulePageProps {
  moduleKey: DashboardModule['key'];
  children: React.ReactNode;
}

/** Guards a module page by its permission and renders its heading. */
export function ModulePage({ moduleKey, children }: ModulePageProps) {
  const dashboardModule = getModule(moduleKey);

  return (
    <RequirePermission anyOf={[dashboardModule.permission]}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{dashboardModule.label}</h1>
          <p className="text-sm text-muted">{dashboardModule.description}</p>
        </div>
        {children}
      </div>
    </RequirePermission>
  );
}
