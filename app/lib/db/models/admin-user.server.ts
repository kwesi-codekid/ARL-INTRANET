import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface IAdminUser extends Document {
  phone: string;
  name: string;
  email?: string;
  role: "admin" | "superadmin";
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
      index: true,
    },
    department: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
AdminUserSchema.index({ role: 1, isActive: 1 });
AdminUserSchema.index({ name: "text" });

export const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
