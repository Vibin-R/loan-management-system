'use client';

import { useAuth } from '@/lib/auth-context';
import { allowedModules } from '@/lib/modules';
import { MODULE_ICONS } from '@/components/dashboard/moduleIcons';
import { HomeIcon } from '@/components/ui/icons';
import { AppSidebar, type NavItem } from './AppSidebar';

/** Staff navigation: Overview plus only the modules this user holds permissions for. */
export function DashboardSidebar() {
  const { can } = useAuth();
  const items: NavItem[] = [
    { href: '/dashboard', label: 'Overview', Icon: HomeIcon, exact: true },
    ...allowedModules(can).map((m) => ({
      href: m.href,
      label: m.label,
      Icon: MODULE_ICONS[m.key],
    })),
  ];
  return <AppSidebar homeHref="/dashboard" items={items} />;
}
