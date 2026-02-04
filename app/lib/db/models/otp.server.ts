/**
 * OTP Schema for temporary OTP storage
 * Task: 1.1.2.1.3
 */

import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IOTP extends Document {
  phone: string;
  otp: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    phone: {
      type: String,
      required: true,
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
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for phone lookups
OTPSchema.index({ phone: 1, createdAt: -1 });

export const OTP = mongoose.models.OTP || mongoose.model<IOTP>("OTP", OTPSchema);
