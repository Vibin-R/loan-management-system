/** Mirrors server/src/constants/permissions.ts. The server enforces these; the client only uses them to shape the UI. */
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
