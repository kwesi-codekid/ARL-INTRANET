import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Admin roles for the system
 */
export const ADMIN_ROLES = ["superadmin", "admin", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * OTP sub-schema interface
 */
export interface IOtp {
  code: string | null;
  expiresAt: Date | null;
  attempts: number;
}

/**
 * Admin document interface
 */
export interface IAdmin {
  name: string;
  phone: string;
  email?: string;
  role: AdminRole;
  isActive: boolean;
  otp: IOtp;
  lastLoginAt?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin document with Mongoose Document methods
 */
export interface IAdminDocument extends IAdmin, Document {
  isOtpValid(code: string): boolean;
  clearOtp(): Promise<IAdminDocument>;
}

/**
 * Admin model static methods
 */
export interface IAdminModel extends Model<IAdminDocument> {
  findByPhone(phone: string): Promise<IAdminDocument | null>;
}

/**
 * OTP sub-schema
 */
const otpSchema = new Schema<IOtp>(
  {
    code: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * Admin schema definition
 */
const adminSchema = new Schema<IAdminDocument, IAdminModel>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^\+?[\d\s-]{10,20}$/, "Please provide a valid phone number"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    role: {
      type: String,
      enum: {
        values: ADMIN_ROLES,
        message: "{VALUE} is not a valid role",
      },
      default: "editor",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: otpSchema,
      default: () => ({ code: null, expiresAt: null, attempts: 0 }),
    },
    lastLoginAt: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.otp;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Indexes
 */
adminSchema.index({ role: 1, isActive: 1 });

/**
 * Instance method: Check if OTP is valid
 */
adminSchema.methods.isOtpValid = function (code: string): boolean {
  if (!this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  if (this.otp.attempts >= 3) {
    return false;
  }
  if (new Date() > this.otp.expiresAt) {
    return false;
  }
  return this.otp.code === code;
};

/**
 * Instance method: Clear OTP after successful verification
 */
adminSchema.methods.clearOtp = async function (): Promise<IAdminDocument> {
  this.otp = { code: null, expiresAt: null, attempts: 0 };
  return this.save();
};

/**
 * Static method: Find admin by phone
 */
adminSchema.statics.findByPhone = function (
  phone: string
): Promise<IAdminDocument | null> {
  return this.findOne({ phone, isActive: true });
};

/**
 * Admin model
 */
export const Admin =
  (mongoose.models.Admin as IAdminModel) ||
  mongoose.model<IAdminDocument, IAdminModel>("Admin", adminSchema);
