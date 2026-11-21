import mongoose, { Schema, model, Document } from "mongoose";
import { UserRole, UserPermission } from "@veyora/types";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  permissions: UserPermission[];
  isEmailVerified: boolean;
  isActive: boolean;
  statusReason?: string | null;
  notes?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ["customer", "admin", "superadmin"],
      default: "customer",
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    statusReason: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User: mongoose.Model<IUser> =
  (mongoose.models.User as mongoose.Model<IUser>) || model<IUser>("User", userSchema);
