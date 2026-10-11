import { EmptyQueue, ModulePage } from '@/components/dashboard/ModulePage';

export default function SalesPage() {
  return (
    <ModulePage moduleKey="sales">
      <EmptyQueue message="No leads yet. Borrowers who sign up but haven't applied will appear here." />
    </ModulePage>
  );
}
