import { EmptyQueue, ModulePage } from '@/components/dashboard/ModulePage';

export default function DisbursementPage() {
  return (
    <ModulePage moduleKey="disbursement">
      <EmptyQueue message="No sanctioned loans waiting for disbursal." />
    </ModulePage>
  );
}
