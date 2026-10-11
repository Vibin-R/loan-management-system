import { Schema, model, type InferSchemaType } from 'mongoose';
import { EMPLOYMENT_MODES, LOAN_RULES, LOAN_STATUS } from '../constants/loan';
import { salarySlipSchema } from './schemas/salarySlip.schema';

const statuses = Object.values(LOAN_STATUS);

const historyEntrySchema = new Schema(
  {
    from: { type: String, enum: [...statuses, null], default: null },
    to: { type: String, enum: statuses, required: true },
    by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, required: true },
    note: { type: String, default: '' },
  },
  { _id: false },
);

const applicantSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    pan: { type: String, required: true },
    dob: { type: Date, required: true },
    ageAtApplication: { type: Number, required: true },
    monthlySalary: { type: Number, required: true }, // paise
    employmentMode: { type: String, enum: Object.values(EMPLOYMENT_MODES), required: true },
    breCheckedAt: { type: Date, required: true },
  },
  { _id: false },
);

const loanSchema = new Schema(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Snapshot of the applicant at apply time, so later profile edits don't change it. */
    applicant: { type: applicantSchema, required: true },
    // All money fields are integer paise.
    principal: { type: Number, required: true, min: 0 },
    tenureDays: {
      type: Number,
      required: true,
      min: LOAN_RULES.minTenureDays,
      max: LOAN_RULES.maxTenureDays,
    },
    annualRate: { type: Number, required: true },
    interest: { type: Number, required: true, min: 0 },
    totalRepayment: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: statuses, required: true, default: LOAN_STATUS.APPLIED },
    /** True while APPLIED / SANCTIONED / DISBURSED. Backs the one-active-loan index. */
    isActive: { type: Boolean, required: true, default: true },
    salarySlip: { type: salarySlipSchema, required: true },
    rejectionReason: { type: String, default: null },
    sanctionedAt: Date,
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: Date,
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: Date,
    history: { type: [historyEntrySchema], default: [] },
  },
  { timestamps: true },
);

loanSchema.index({ status: 1, createdAt: -1 });
loanSchema.index({ borrowerId: 1, createdAt: -1 });
loanSchema.index({ 'applicant.pan': 1 });
// At most one open loan per borrower, enforced by the database even under a race.
loanSchema.index(
  { borrowerId: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'one_active_loan_per_borrower',
  },
);

export type LoanDoc = InferSchemaType<typeof loanSchema>;

export const LoanModel = model('Loan', loanSchema);
