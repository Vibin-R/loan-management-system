import { PERMISSIONS, type Permission } from './permissions';

export interface DashboardModule {
  key: 'sales' | 'sanction' | 'disbursement' | 'collection';
  label: string;
  description: string;
  /** What the module's queue count means, e.g. "awaiting review". */
  countLabel: string;
  href: string;
  /** Holding this permission shows the module in the sidebar and allows opening it. */
  permission: Permission;
}

/** The four operations modules, in loan-lifecycle order. */
export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    key: 'sales',
    label: 'Sales',
    description: 'Registered users who have not applied yet',
    countLabel: 'open leads',
    href: '/dashboard/sales',
    permission: PERMISSIONS.LEAD_READ,
  },
  {
    key: 'sanction',
    label: 'Sanction',
    description: 'Review applications and approve or reject them',
    countLabel: 'awaiting review',
    href: '/dashboard/sanction',
    permission: PERMISSIONS.LOAN_SANCTION,
  },
  {
    key: 'disbursement',
    label: 'Disbursement',
    description: 'Release funds for sanctioned loans',
    countLabel: 'ready to disburse',
    href: '/dashboard/disbursement',
    permission: PERMISSIONS.LOAN_DISBURSE,
  },
  {
    key: 'collection',
    label: 'Collection',
    description: 'Record repayments on disbursed loans',
    countLabel: 'being repaid',
    href: '/dashboard/collection',
    permission: PERMISSIONS.PAYMENT_RECORD,
  },
];

export const getModule = (key: DashboardModule['key']): DashboardModule =>
  DASHBOARD_MODULES.find((m) => m.key === key)!;

export const allowedModules = (can: (p: Permission) => boolean): DashboardModule[] =>
  DASHBOARD_MODULES.filter((m) => can(m.permission));

/** Whether the user may open a given app path. Used to decide if a `?next=` redirect is sensible. */
export function canAccessPath(path: string, can: (p: Permission) => boolean): boolean {
  if (path.startsWith('/apply') || path.startsWith('/my-loans')) {
    return can(PERMISSIONS.APPLICATION_MANAGE_OWN);
  }
  if (path.startsWith('/dashboard')) {
    const target = DASHBOARD_MODULES.find((m) => path.startsWith(m.href));
    return target ? can(target.permission) : allowedModules(can).length > 0;
  }
  return true;
}

/** Where a user lands after login: borrower portal, their single module, or the module picker. */
export function getHomePath(can: (p: Permission) => boolean): string {
  if (can(PERMISSIONS.APPLICATION_MANAGE_OWN)) return '/apply';
  const modules = allowedModules(can);
  if (modules.length === 1) return modules[0]!.href;
  if (modules.length > 1) return '/dashboard';
  return '/no-access';
}
