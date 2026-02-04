/**
 * Activity Log Schema
 * Task: 1.1.2.4.7
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  action: "create" | "update" | "delete" | "activate" | "deactivate" | "login" | "logout" | "view";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    userName: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "activate", "deactivate", "login", "logout", "view"],
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ resource: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });

// Auto-delete logs older than 90 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
