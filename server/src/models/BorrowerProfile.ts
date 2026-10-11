import { Schema, model, type InferSchemaType } from 'mongoose';
import { EMPLOYMENT_MODES } from '../constants/loan';
import { salarySlipSchema } from './schemas/salarySlip.schema';

const breFailureSchema = new Schema(
  { rule: { type: String, required: true }, message: { type: String, required: true } },
  { _id: false },
);

const breResultSchema = new Schema(
  {
    passed: { type: Boolean, required: true },
    failures: { type: [breFailureSchema], default: [] },
    checkedAt: { type: Date, required: true },
  },
  { _id: false },
);

const borrowerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true, index: true },
    /** Date of birth, stored as midnight IST. */
    dob: { type: Date, required: true },
    /** Paise. */
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: { type: String, enum: Object.values(EMPLOYMENT_MODES), required: true },
    /** Latest eligibility result. Saved even when it fails, so Sales can follow up. */
    bre: { type: breResultSchema, required: true },
    /** Uploaded in step 3; moved onto the loan when the borrower applies. */
    salarySlip: { type: salarySlipSchema, default: null },
  },
  { timestamps: true },
);

export type BorrowerProfileDoc = InferSchemaType<typeof borrowerProfileSchema>;

export const BorrowerProfileModel = model('BorrowerProfile', borrowerProfileSchema);
