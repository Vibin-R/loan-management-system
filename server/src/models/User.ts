import { Schema, Types, model, type InferSchemaType } from 'mongoose';
import { APPLICATION_STAGES } from '../constants/applicationStage';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
      validate: {
        validator: (roles: Types.ObjectId[]) => roles.length > 0,
        message: 'A user needs at least one role',
      },
    },
    /** Bumped when this user's roles or one of their roles changes, to refresh cached access. */
    permVersion: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    /** Borrowers only; null for staff. */
    applicationStage: {
      type: String,
      enum: [...Object.values(APPLICATION_STAGES), null],
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.index({ roles: 1 });
userSchema.index({ applicationStage: 1, createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema>;

export const UserModel = model('User', userSchema);
