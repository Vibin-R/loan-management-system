import { EmptyQueue, ModulePage } from '@/components/dashboard/ModulePage';

export default function CollectionPage() {
  return (
    <ModulePage moduleKey="collection">
      <EmptyQueue message="No active loans to collect on." />
    </ModulePage>
  );
}
