import { Schema, model, type InferSchemaType } from 'mongoose';
import { isPermission } from '../constants/permissions';

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (keys: string[]) => keys.every(isPermission),
        message: 'Role contains an unknown permission',
      },
    },
    /** System roles come from the seed and can't be deleted or renamed. */
    isSystem: { type: Boolean, default: false },
    /** Incremented whenever `permissions` changes. */
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export type RoleDoc = InferSchemaType<typeof roleSchema>;

export const RoleModel = model('Role', roleSchema);
