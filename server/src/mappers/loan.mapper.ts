import type { Types } from 'mongoose';
import type { LoanDoc } from '../models/Loan';
import type { BorrowerProfileDoc } from '../models/BorrowerProfile';
import type { PaymentDoc } from '../models/Payment';
import { formatCalendarDate, toISTCalendarDate } from '../utils/dates';
import { toRupees } from '../utils/money';

/** Converts stored documents (paise, internal fields) into API responses (rupees). */

type WithId<T> = T & { _id: Types.ObjectId };

const toDateOnly = (date: Date): string => formatCalendarDate(toISTCalendarDate(date));

export function toLoanResponse(loan: WithId<LoanDoc>) {
  return {
    id: loan._id.toString(),
    status: loan.status,
    principal: toRupees(loan.principal),
    tenureDays: loan.tenureDays,
    annualRate: loan.annualRate,
    interest: toRupees(loan.interest),
    totalRepayment: toRupees(loan.totalRepayment),
    amountPaid: toRupees(loan.amountPaid),
    outstanding: toRupees(loan.totalRepayment - loan.amountPaid),
    applicant: {
      fullName: loan.applicant.fullName,
      email: loan.applicant.email,
      pan: loan.applicant.pan,
      dob: toDateOnly(loan.applicant.dob),
      ageAtApplication: loan.applicant.ageAtApplication,
      monthlySalary: toRupees(loan.applicant.monthlySalary),
      employmentMode: loan.applicant.employmentMode,
    },
    salarySlip: {
      originalName: loan.salarySlip.originalName,
      mimeType: loan.salarySlip.mimeType,
      size: loan.salarySlip.size,
    },
    rejectionReason: loan.rejectionReason ?? null,
    history: loan.history.map((entry) => ({
      from: entry.from ?? null,
      to: entry.to,
      at: entry.at,
      note: entry.note,
    })),
    createdAt: loan.createdAt,
    sanctionedAt: loan.sanctionedAt ?? null,
    disbursedAt: loan.disbursedAt ?? null,
    closedAt: loan.closedAt ?? null,
  };
}

export function toProfileResponse(profile: WithId<BorrowerProfileDoc>) {
  return {
    fullName: profile.fullName,
    pan: profile.pan,
    dob: toDateOnly(profile.dob),
    monthlySalary: toRupees(profile.monthlySalary),
    employmentMode: profile.employmentMode,
    bre: { passed: profile.bre.passed, failures: profile.bre.failures },
    salarySlip: profile.salarySlip
      ? {
          originalName: profile.salarySlip.originalName,
          mimeType: profile.salarySlip.mimeType,
          size: profile.salarySlip.size,
          uploadedAt: profile.salarySlip.uploadedAt,
        }
      : null,
  };
}

export type LoanResponse = ReturnType<typeof toLoanResponse>;
export type ProfileResponse = ReturnType<typeof toProfileResponse>;

export function toPaymentResponse(payment: WithId<PaymentDoc>) {
  return {
    id: payment._id.toString(),
    utr: payment.utr,
    amount: toRupees(payment.amount),
    paidOn: toDateOnly(payment.paidOn),
    recordedAt: payment.createdAt,
  };
}

export type PaymentResponse = ReturnType<typeof toPaymentResponse>;
