import type { Request, Response } from 'express';
import { LOAN_STATUS } from '../constants/loan';
import { getAuthUser } from '../middleware/authenticate';
import * as loanService from '../services/loan.service';
import { listLoansByStatus } from '../services/loanQueue.service';
import { transitionLoan } from '../services/loanTransition.service';
import * as paymentService from '../services/payment.service';
import { listLeads } from '../services/sales.service';
import type { ListQuery } from '../utils/pagination';
import type {
  IdParam,
  LeadsQuery,
  PaymentInput,
  RejectInput,
} from '../validators/operations.schema';

/**
 * Handlers for the four operations modules and shared loan detail.
 * Each one reads validated input from res.locals and delegates to a service.
 */
const loanId = (res: Response) => (res.locals.params as IdParam).id;
const listQuery = (res: Response) => res.locals.query as ListQuery;

// Sales
export async function getLeads(_req: Request, res: Response) {
  res.json({ data: await listLeads(res.locals.query as LeadsQuery) });
}

// Sanction
export async function getApplied(_req: Request, res: Response) {
  res.json({ data: await listLoansByStatus(LOAN_STATUS.APPLIED, listQuery(res)) });
}

export async function approve(req: Request, res: Response) {
  const loan = await transitionLoan(loanId(res), 'APPROVE', getAuthUser(req), 'Approved');
  res.json({ data: { loan } });
}

export async function reject(req: Request, res: Response) {
  const { reason } = res.locals.body as RejectInput;
  const loan = await transitionLoan(loanId(res), 'REJECT', getAuthUser(req), reason);
  res.json({ data: { loan } });
}

// Disbursement
export async function getSanctioned(_req: Request, res: Response) {
  res.json({ data: await listLoansByStatus(LOAN_STATUS.SANCTIONED, listQuery(res)) });
}

export async function disburse(req: Request, res: Response) {
  const loan = await transitionLoan(loanId(res), 'DISBURSE', getAuthUser(req), 'Funds released');
  res.json({ data: { loan } });
}

// Collection
export async function getDisbursed(_req: Request, res: Response) {
  res.json({ data: await listLoansByStatus(LOAN_STATUS.DISBURSED, listQuery(res)) });
}

export async function getPayments(_req: Request, res: Response) {
  res.json({ data: { items: await paymentService.listPayments(loanId(res)) } });
}

export async function recordPayment(req: Request, res: Response) {
  const result = await paymentService.recordPayment(
    loanId(res),
    res.locals.body as PaymentInput,
    getAuthUser(req),
  );
  res.status(201).json({ data: result });
}

// Shared loan detail
export async function getLoan(req: Request, res: Response) {
  res.json({ data: await loanService.getLoanDetail(loanId(res), getAuthUser(req)) });
}

export async function getSalarySlip(req: Request, res: Response) {
  const file = await loanService.getSalarySlipFile(loanId(res), getAuthUser(req));
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
  res.sendFile(file.path);
}
