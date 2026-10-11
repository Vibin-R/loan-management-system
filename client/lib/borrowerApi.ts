import { api } from './api';
import type {
  ApplicationState,
  BorrowerProfile,
  EmploymentMode,
  Loan,
  SalarySlipInfo,
} from './types';

export interface ProfileInput {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

/** Borrower portal endpoints (docs/DESIGN.md §6, Borrower). */
export const borrowerApi = {
  getApplication: () => api.get<ApplicationState>('/borrower/application'),

  saveProfile: (input: ProfileInput) =>
    api.put<{ profile: BorrowerProfile }>('/borrower/profile', input),

  uploadSalarySlip: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<{ salarySlip: SalarySlipInfo }>('/borrower/salary-slip', form, onProgress);
  },

  applyForLoan: (principal: number, tenureDays: number) =>
    api.post<{ loan: Loan }>('/borrower/loans', { principal, tenureDays }),

  listMyLoans: () => api.get<{ items: Loan[] }>('/borrower/loans'),
};
