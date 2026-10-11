import { ModulePage } from '@/components/dashboard/ModulePage';
import { SanctionModule } from '@/components/dashboard/modules/SanctionModule';

export default function SanctionPage() {
  return (
    <ModulePage moduleKey="sanction">
      <SanctionModule />
    </ModulePage>
  );
}
