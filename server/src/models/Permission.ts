import { Schema, model, type InferSchemaType } from 'mongoose';

const permissionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    resource: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true },
);

export type PermissionDoc = InferSchemaType<typeof permissionSchema>;

export const PermissionModel = model('Permission', permissionSchema);
