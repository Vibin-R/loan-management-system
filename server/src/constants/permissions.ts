/**
 * Every permission the system enforces. Format: `resource:action`.
 * This list is the source of truth: the seed copies it into the `permissions` collection,
 * and roles may only reference keys defined here (each one has code that enforces it).
 */
export const PERMISSIONS = {
  APPLICATION_MANAGE_OWN: 'application:manage_own',
  LEAD_READ: 'lead:read',
  LOAN_READ: 'loan:read',
  LOAN_DOCUMENT_READ: 'loan:document:read',
  LOAN_SANCTION: 'loan:sanction',
  LOAN_DISBURSE: 'loan:disburse',
  PAYMENT_RECORD: 'payment:record',
  ROLE_MANAGE: 'role:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'application:manage_own': 'Fill in own profile, upload own salary slip, apply and view own loans',
  'lead:read': 'View borrowers who registered but have not applied (Sales)',
  'loan:read': 'View any loan with its history and payments',
  'loan:document:read': "Open an applicant's salary slip",
  'loan:sanction': 'Review applied loans and approve or reject them',
  'loan:disburse': 'Mark sanctioned loans as disbursed',
  'payment:record': 'Record repayments against disbursed loans',
  'role:manage': 'Create and edit roles and assign them to users',
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const isPermission = (value: string): value is Permission =>
  (ALL_PERMISSIONS as string[]).includes(value);
