/**
 * RefreshToken Model - Store JWT Refresh Tokens
 * Used for token renewal and revocation
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  token: string; // Hashed refresh token
  deviceInfo?: string; // User agent / device identifier
  ipAddress?: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - automatically delete expired tokens after 24 hours past expiry
RefreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 }
);

// Compound index for user token lookups
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export const RefreshToken: Model<IRefreshToken> =
  mongoose.models.RefreshToken ||
  mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
