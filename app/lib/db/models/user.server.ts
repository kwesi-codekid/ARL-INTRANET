/**
 * User Model - Regular Portal Users (Employees/Staff)
 * Separate from AdminUser - uses JWT authentication
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

export type UserRole = "user" | "manager" | "department_head";
export type UserLocation = "site" | "head-office";

export interface IUser extends Document {
  employeeId?: string;
  name: string;
  phone: string; // Primary auth (Ghana format)
  email?: string; // Secondary auth
  department: Types.ObjectId;
  position: string;
  location: UserLocation;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  isVerified: boolean; // Phone verified
  emailVerified: boolean;
  lastLogin?: Date;
  lastLoginIP?: string;
  loginCount: number;
  createdBy: Types.ObjectId; // Admin who created
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      enum: ["site", "head-office"],
      default: "site",
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "manager", "department_head"],
      default: "user",
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
UserSchema.index({ department: 1, isActive: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ name: "text", position: "text" });
UserSchema.index({ createdAt: -1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
