/**
 * TokenBlacklist Model - Store Blacklisted JWT IDs
 * Used for logout functionality - prevents reuse of logged out tokens
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface ITokenBlacklist extends Document {
  jti: string; // JWT ID
  expiresAt: Date; // When the original token expires
  blacklistedAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    blacklistedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index - automatically delete entries after the token's expiry time
// This keeps the blacklist table clean - no need to store entries for expired tokens
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenBlacklist: Model<ITokenBlacklist> =
  mongoose.models.TokenBlacklist ||
  mongoose.model<ITokenBlacklist>("TokenBlacklist", TokenBlacklistSchema);
