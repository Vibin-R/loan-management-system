/** Seeded accounts (server/src/scripts/seedData.ts), listed on the login page for quick testing. */
export const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@lms.dev', password: 'Admin@123' },
  { role: 'Sales', email: 'sales@lms.dev', password: 'Sales@123' },
  { role: 'Sanction', email: 'sanction@lms.dev', password: 'Sanction@123' },
  { role: 'Disbursement', email: 'disbursement@lms.dev', password: 'Disburse@123' },
  { role: 'Collection', email: 'collection@lms.dev', password: 'Collect@123' },
  { role: 'Borrower', email: 'borrower@lms.dev', password: 'Borrower@123' },
] as const;
