import { Schema, model, type InferSchemaType } from 'mongoose';

const paymentSchema = new Schema(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    /** Bank transaction reference. Unique across all payments, so a payment can't be recorded twice. */
    utr: { type: String, required: true, unique: true, uppercase: true, trim: true },
    /** Paise. */
    amount: { type: Number, required: true, min: 1 },
    /** Calendar date of the payment, stored as midnight IST. */
    paidOn: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

paymentSchema.index({ loanId: 1, paidOn: -1 });

export type PaymentDoc = InferSchemaType<typeof paymentSchema>;

export const PaymentModel = model('Payment', paymentSchema);
