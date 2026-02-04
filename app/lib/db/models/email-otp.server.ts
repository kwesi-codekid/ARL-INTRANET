/**
 * EmailOTP Schema for temporary email OTP storage
 * Similar to phone OTP but keyed by email
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface IEmailOTP extends Document {
  email: string;
  otp: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}

const EmailOTPSchema = new Schema<IEmailOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - automatically delete expired OTPs
EmailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for email lookups
EmailOTPSchema.index({ email: 1, createdAt: -1 });

export const EmailOTP: Model<IEmailOTP> =
  mongoose.models.EmailOTP || mongoose.model<IEmailOTP>("EmailOTP", EmailOTPSchema);
