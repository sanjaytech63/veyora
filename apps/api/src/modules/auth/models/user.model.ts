import mongoose, { Schema, model, Document } from "mongoose";
import { UserRole, UserPermission } from "@veyora/types";

export interface IUserAvatar {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface IUserPreferences {
  language?: string;
  timezone?: string;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatar?: IUserAvatar | null;
  bio?: string | null;
  dateOfBirth?: Date | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  preferences?: IUserPreferences;
  phone?: string | null;
  role: UserRole;
  permissions: UserPermission[];
  assignedRoles?: mongoose.Types.ObjectId[];
  customPermissions?: string[];
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
    displayName: {
      type: String,
      trim: true,
      default: null,
      maxlength: 100,
    },
    avatar: {
      publicId: { type: String, default: null },
      secureUrl: { type: String, default: null },
      width: { type: Number },
      height: { type: Number },
      format: { type: String },
      bytes: { type: Number },
    },
    bio: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say", null],
      default: null,
    },
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
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
    assignedRoles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    customPermissions: {
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
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["passwordHash"];
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["passwordHash"];
        return ret;
      },
    },
  }
);

export const User: mongoose.Model<IUser> =
  (mongoose.models.User as mongoose.Model<IUser>) || model<IUser>("User", userSchema);
