import { ModulePage } from '@/components/dashboard/ModulePage';
import { DisbursementModule } from '@/components/dashboard/modules/DisbursementModule';

export default function DisbursementPage() {
  return (
    <ModulePage moduleKey="disbursement">
      <DisbursementModule />
    </ModulePage>
  );
}
