import { EmptyQueue, ModulePage } from '@/components/dashboard/ModulePage';

export default function SanctionPage() {
  return (
    <ModulePage moduleKey="sanction">
      <EmptyQueue message="No applications waiting for review." />
    </ModulePage>
  );
}
