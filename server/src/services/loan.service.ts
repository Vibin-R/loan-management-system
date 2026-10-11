import { PERMISSIONS, type Permission } from '../constants/permissions';
import { toLoanResponse } from '../mappers/loan.mapper';
import { LoanModel } from '../models/Loan';
import { AppError } from '../utils/AppError';
import { listPayments } from './payment.service';
import type { UserAccess } from './permission.service';
import { resolveStoragePath } from './storage.service';

/**
 * Loads a loan the caller may see: staff with `staffPermission`, or the borrower who owns it.
 * Anyone else gets 404 (not 403), so a borrower can't even confirm another loan exists.
 */
async function findAccessibleLoan(loanId: string, actor: UserAccess, staffPermission: Permission) {
  const loan = await LoanModel.findById(loanId).lean();
  if (!loan) throw AppError.notFound('Loan');

  const isStaff = actor.permissions.has(staffPermission);
  const isOwner =
    actor.permissions.has(PERMISSIONS.APPLICATION_MANAGE_OWN) &&
    loan.borrowerId.toString() === actor.id;
  if (!isStaff && !isOwner) throw AppError.notFound('Loan');
  return loan;
}

export async function getLoanDetail(loanId: string, actor: UserAccess) {
  const loan = await findAccessibleLoan(loanId, actor, PERMISSIONS.LOAN_READ);
  return { loan: toLoanResponse(loan), payments: await listPayments(loanId) };
}

export async function getSalarySlipFile(loanId: string, actor: UserAccess) {
  const loan = await findAccessibleLoan(loanId, actor, PERMISSIONS.LOAN_DOCUMENT_READ);
  return {
    path: resolveStoragePath(loan.salarySlip.storageKey),
    mimeType: loan.salarySlip.mimeType,
    fileName: loan.salarySlip.originalName,
  };
}
