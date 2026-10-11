import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from './permissions';

export const ROLE_NAMES = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  SANCTION: 'SANCTION',
  DISBURSEMENT: 'DISBURSEMENT',
  COLLECTION: 'COLLECTION',
  BORROWER: 'BORROWER',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

interface DefaultRole {
  name: RoleName;
  description: string;
  permissions: Permission[];
}

/** System roles created by the seed. They can be edited but not deleted or renamed. */
export const DEFAULT_ROLES: DefaultRole[] = [
  {
    name: ROLE_NAMES.BORROWER,
    description: 'Applies for loans through the borrower portal',
    permissions: [PERMISSIONS.APPLICATION_MANAGE_OWN],
  },
  {
    name: ROLE_NAMES.SALES,
    description: 'Follows up with registered users who have not applied yet',
    permissions: [PERMISSIONS.LEAD_READ, PERMISSIONS.LOAN_READ],
  },
  {
    name: ROLE_NAMES.SANCTION,
    description: 'Reviews applications and approves or rejects them',
    permissions: [PERMISSIONS.LOAN_SANCTION, PERMISSIONS.LOAN_READ, PERMISSIONS.LOAN_DOCUMENT_READ],
  },
  {
    name: ROLE_NAMES.DISBURSEMENT,
    description: 'Releases funds for sanctioned loans',
    permissions: [PERMISSIONS.LOAN_DISBURSE, PERMISSIONS.LOAN_READ],
  },
  {
    name: ROLE_NAMES.COLLECTION,
    description: 'Records repayments on disbursed loans',
    permissions: [PERMISSIONS.PAYMENT_RECORD, PERMISSIONS.LOAN_READ],
  },
  {
    name: ROLE_NAMES.ADMIN,
    description: 'Full access to every operations module and role management',
    // Every staff permission; borrower actions stay separate so staff never act as a borrower.
    permissions: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.APPLICATION_MANAGE_OWN),
  },
];
