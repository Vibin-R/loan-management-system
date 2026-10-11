import { ROLE_NAMES, type RoleName } from '../constants/roles';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: RoleName;
}

/** One account per role with known credentials, so every role can be tested immediately. */
export const SEED_USERS: SeedUser[] = [
  { name: 'Asha Admin', email: 'admin@lms.dev', password: 'Admin@123', role: ROLE_NAMES.ADMIN },
  { name: 'Sameer Sales', email: 'sales@lms.dev', password: 'Sales@123', role: ROLE_NAMES.SALES },
  {
    name: 'Shreya Sanction',
    email: 'sanction@lms.dev',
    password: 'Sanction@123',
    role: ROLE_NAMES.SANCTION,
  },
  {
    name: 'Dev Disbursement',
    email: 'disbursement@lms.dev',
    password: 'Disburse@123',
    role: ROLE_NAMES.DISBURSEMENT,
  },
  {
    name: 'Kiran Collection',
    email: 'collection@lms.dev',
    password: 'Collect@123',
    role: ROLE_NAMES.COLLECTION,
  },
  {
    name: 'Bhavya Borrower',
    email: 'borrower@lms.dev',
    password: 'Borrower@123',
    role: ROLE_NAMES.BORROWER,
  },
];
