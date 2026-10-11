import { Schema, type InferSchemaType } from 'mongoose';

/** A stored salary slip. `storageKey` is resolved by the storage service; never a user path. */
export const salarySlipSchema = new Schema(
  {
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

export type SalarySlip = InferSchemaType<typeof salarySlipSchema>;
