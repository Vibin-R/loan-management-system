import mongoose, { type ClientSession } from 'mongoose';
import { supportsTransactions } from '../config/db';
import { LOAN_STATUS } from '../constants/loan';
import { toLoanResponse, toPaymentResponse } from '../mappers/loan.mapper';
import { LoanModel } from '../models/Loan';
import { PaymentModel } from '../models/Payment';
import { AppError } from '../utils/AppError';
import { compareCalendarDates, istMidnight, toISTCalendarDate, todayIST } from '../utils/dates';
import { toPaise, toRupees } from '../utils/money';
import type { PaymentInput } from '../validators/operations.schema';
import type { UserAccess } from './permission.service';

interface PaymentRequest {
  loanId: string;
  utr: string;
  amountPaise: number;
  paidOn: Date;
  actorId: string;
  /** Fixed when the loan is created, so it is safe to use in the guards below. */
  totalRepayment: number;
}

/**
 * Checks that give the executive a precise message before anything is written.
 * Returns the loan's total repayment for the atomic guards.
 */
async function validatePayment(
  loanId: string,
  input: PaymentInput,
  amountPaise: number,
): Promise<number> {
  const loan = await LoanModel.findById(loanId)
    .select('status totalRepayment amountPaid disbursedAt')
    .lean();
  if (!loan) throw AppError.notFound('Loan');
  if (loan.status !== LOAN_STATUS.DISBURSED || !loan.disbursedAt) {
    throw AppError.conflict(
      'INVALID_LOAN_STATUS',
      'Payments can only be recorded on disbursed loans',
    );
  }
  if (compareCalendarDates(input.paidOn, todayIST()) > 0) {
    throw AppError.badRequest('Payment date cannot be in the future', [
      { field: 'paidOn', message: 'Payment date cannot be in the future' },
    ]);
  }
  if (compareCalendarDates(input.paidOn, toISTCalendarDate(loan.disbursedAt)) < 0) {
    throw AppError.badRequest('Payment date cannot be before the loan was disbursed', [
      { field: 'paidOn', message: 'Payment date cannot be before the disbursal date' },
    ]);
  }
  const outstanding = loan.totalRepayment - loan.amountPaid;
  if (amountPaise > outstanding) {
    throw AppError.unprocessable(
      'AMOUNT_EXCEEDS_OUTSTANDING',
      `Amount is more than the outstanding balance of ₹${toRupees(outstanding).toFixed(2)}`,
      { outstanding: toRupees(outstanding) },
    );
  }
  if (await PaymentModel.exists({ utr: input.utr })) {
    throw AppError.conflict('DUPLICATE_UTR', 'A payment with this UTR number is already recorded');
  }
  return loan.totalRepayment;
}

/**
 * Adds the payment to the loan's balance, but only while the loan is DISBURSED and the payment
 * still fits: `amountPaid ≤ totalRepayment − amount` is checked and applied in one atomic
 * update, so two payments racing each other can never overpay the loan.
 */
async function applyToBalance(req: PaymentRequest, session?: ClientSession) {
  const loan = await LoanModel.findOneAndUpdate(
    {
      _id: req.loanId,
      status: LOAN_STATUS.DISBURSED,
      amountPaid: { $lte: req.totalRepayment - req.amountPaise },
    },
    { $inc: { amountPaid: req.amountPaise } },
    { new: true, session },
  ).lean();
  if (!loan) {
    throw AppError.unprocessable(
      'AMOUNT_EXCEEDS_OUTSTANDING',
      'The balance changed while saving. Refresh and check the outstanding amount.',
    );
  }
  return loan;
}

/** Closes the loan when the balance reaches zero. Matches only once, so it can't close twice. */
async function closeIfFullyPaid(req: PaymentRequest, session?: ClientSession) {
  const at = new Date();
  await LoanModel.updateOne(
    {
      _id: req.loanId,
      status: LOAN_STATUS.DISBURSED,
      amountPaid: req.totalRepayment,
    },
    {
      $set: { status: LOAN_STATUS.CLOSED, closedAt: at, isActive: false },
      $push: {
        history: {
          from: LOAN_STATUS.DISBURSED,
          to: LOAN_STATUS.CLOSED,
          by: req.actorId,
          at,
          note: 'Fully repaid',
        },
      },
    },
    { session },
  );
}

const paymentDoc = (req: PaymentRequest) => ({
  loanId: req.loanId,
  utr: req.utr,
  amount: req.amountPaise,
  paidOn: req.paidOn,
  recordedBy: req.actorId,
});

/** Replica set (Atlas): payment, balance and closing commit together or not at all. */
async function recordWithTransaction(req: PaymentRequest) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await PaymentModel.create([paymentDoc(req)], { session });
      await applyToBalance(req, session);
      await closeIfFullyPaid(req, session);
    });
  } finally {
    await session.endSession();
  }
}

/**
 * Standalone MongoDB (no transactions): insert the payment first so the unique UTR index
 * rejects a duplicate before the balance is touched. If the balance guard then fails (e.g. a concurrent payment
 * used up the outstanding amount), the payment row is removed again.
 */
async function recordWithoutTransaction(req: PaymentRequest) {
  const payment = await PaymentModel.create(paymentDoc(req));
  try {
    await applyToBalance(req);
  } catch (err) {
    await PaymentModel.deleteOne({ _id: payment._id });
    throw err;
  }
  await closeIfFullyPaid(req);
}

export async function recordPayment(loanId: string, input: PaymentInput, actor: UserAccess) {
  const amountPaise = toPaise(input.amount);
  const totalRepayment = await validatePayment(loanId, input, amountPaise);

  const req: PaymentRequest = {
    loanId,
    utr: input.utr,
    amountPaise,
    paidOn: istMidnight(input.paidOn),
    actorId: actor.id,
    totalRepayment,
  };
  // A duplicate UTR racing past validation hits the unique index → 409 DUPLICATE_UTR.
  if (supportsTransactions()) await recordWithTransaction(req);
  else await recordWithoutTransaction(req);

  const [loan, payment] = await Promise.all([
    LoanModel.findById(loanId).lean(),
    PaymentModel.findOne({ utr: input.utr }).lean(),
  ]);
  if (!loan || !payment) throw AppError.notFound('Loan');
  return { loan: toLoanResponse(loan), payment: toPaymentResponse(payment) };
}

export async function listPayments(loanId: string) {
  if (!(await LoanModel.exists({ _id: loanId }))) throw AppError.notFound('Loan');
  const payments = await PaymentModel.find({ loanId }).sort({ paidOn: -1, createdAt: -1 }).lean();
  return payments.map(toPaymentResponse);
}
