import { ModulePage } from '@/components/dashboard/ModulePage';
import { CollectionModule } from '@/components/dashboard/modules/CollectionModule';

export default function CollectionPage() {
  return (
    <ModulePage moduleKey="collection">
      <CollectionModule />
    </ModulePage>
  );
}
