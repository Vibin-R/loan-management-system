import { api } from './api';
import type { Lead, LeadStage, ListParams, Loan, Paginated, Payment } from './types';

const listQuery = ({ page, limit = 10, search }: ListParams) => ({ page, limit, search });

/** Operations dashboard endpoints (docs/DESIGN.md §6: Sales, Sanction, Disbursement, Collection). */
export const operationsApi = {
  listLeads: (params: ListParams & { stage?: LeadStage }) =>
    api.get<Paginated<Lead>>('/sales/leads', {
      query: { ...listQuery(params), stage: params.stage },
    }),

  listApplied: (params: ListParams) =>
    api.get<Paginated<Loan>>('/sanction/loans', { query: listQuery(params) }),
  approve: (loanId: string) => api.post<{ loan: Loan }>(`/sanction/loans/${loanId}/approve`),
  reject: (loanId: string, reason: string) =>
    api.post<{ loan: Loan }>(`/sanction/loans/${loanId}/reject`, { reason }),

  listSanctioned: (params: ListParams) =>
    api.get<Paginated<Loan>>('/disbursement/loans', { query: listQuery(params) }),
  disburse: (loanId: string) => api.post<{ loan: Loan }>(`/disbursement/loans/${loanId}/disburse`),

  listDisbursed: (params: ListParams) =>
    api.get<Paginated<Loan>>('/collection/loans', { query: listQuery(params) }),
  listPayments: (loanId: string) =>
    api.get<{ items: Payment[] }>(`/collection/loans/${loanId}/payments`),
  recordPayment: (loanId: string, input: { utr: string; amount: number; paidOn: string }) =>
    api.post<{ loan: Loan; payment: Payment }>(`/collection/loans/${loanId}/payments`, input),

  salarySlip: (loanId: string) => api.getBlob(`/loans/${loanId}/salary-slip`),
};
