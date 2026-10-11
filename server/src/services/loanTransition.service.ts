import { LOAN_STATUS, type LoanStatus } from '../constants/loan';
import { PERMISSIONS, type Permission } from '../constants/permissions';
import { toLoanResponse } from '../mappers/loan.mapper';
import { LoanModel } from '../models/Loan';
import { AppError } from '../utils/AppError';
import type { UserAccess } from './permission.service';

interface Transition {
  from: LoanStatus;
  to: LoanStatus;
  permission: Permission;
}

/** Every move an executive can make. CLOSED is reached only by the payment service. */
export const TRANSITIONS = {
  APPROVE: {
    from: LOAN_STATUS.APPLIED,
    to: LOAN_STATUS.SANCTIONED,
    permission: PERMISSIONS.LOAN_SANCTION,
  },
  REJECT: {
    from: LOAN_STATUS.APPLIED,
    to: LOAN_STATUS.REJECTED,
    permission: PERMISSIONS.LOAN_SANCTION,
  },
  DISBURSE: {
    from: LOAN_STATUS.SANCTIONED,
    to: LOAN_STATUS.DISBURSED,
    permission: PERMISSIONS.LOAN_DISBURSE,
  },
} as const satisfies Record<string, Transition>;

export type TransitionName = keyof typeof TRANSITIONS;

/** Fields each move sets besides `status`. */
function fieldsFor(name: TransitionName, actorId: string, at: Date, reason?: string) {
  switch (name) {
    case 'APPROVE':
      return { sanctionedAt: at, sanctionedBy: actorId };
    case 'REJECT':
      return { rejectionReason: reason, isActive: false };
    case 'DISBURSE':
      return { disbursedAt: at, disbursedBy: actorId };
  }
}

/**
 * Moves a loan from one status to the next. The update only matches while the loan is still
 * in `from`, so two executives clicking at once can't apply the same move twice: the second
 * gets 409. The history entry is written in the same atomic update.
 */
export async function transitionLoan(
  loanId: string,
  name: TransitionName,
  actor: UserAccess,
  note = '',
) {
  const transition = TRANSITIONS[name];
  // Routes already enforce this; checking again keeps the rule next to the move it guards.
  if (!actor.permissions.has(transition.permission)) throw AppError.forbidden();

  const at = new Date();
  const loan = await LoanModel.findOneAndUpdate(
    { _id: loanId, status: transition.from },
    {
      $set: { status: transition.to, ...fieldsFor(name, actor.id, at, note) },
      $push: { history: { from: transition.from, to: transition.to, by: actor.id, at, note } },
    },
    { new: true, lean: true },
  );

  if (!loan) {
    const current = await LoanModel.findById(loanId).select('status').lean();
    if (!current) throw AppError.notFound('Loan');
    throw AppError.conflict(
      'INVALID_TRANSITION',
      `This loan is ${current.status.toLowerCase()}, so it can't be moved to ${transition.to.toLowerCase()}.`,
    );
  }
  return toLoanResponse(loan);
}
