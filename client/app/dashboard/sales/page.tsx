import { ModulePage } from '@/components/dashboard/ModulePage';
import { SalesModule } from '@/components/dashboard/modules/SalesModule';

export default function SalesPage() {
  return (
    <ModulePage moduleKey="sales">
      <SalesModule />
    </ModulePage>
  );
}
