import type { DashboardModule } from '@/lib/modules';
import { BanknoteIcon, ClipboardCheckIcon, UsersIcon, WalletIcon } from '@/components/ui/icons';

/** One icon per module, used in the sidebar and on the overview. */
export const MODULE_ICONS: Record<
  DashboardModule['key'],
  (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
> = {
  sales: UsersIcon,
  sanction: ClipboardCheckIcon,
  disbursement: BanknoteIcon,
  collection: WalletIcon,
};
