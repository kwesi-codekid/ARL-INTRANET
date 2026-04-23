/**
 * Activity Log Schema
 * Task: 1.1.2.4.7
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  action:
    | "create"
    | "update"
    | "delete"
    | "activate"
    | "deactivate"
    | "login"
    | "login_failed"
    | "logout"
    | "view"
    | "reorder"
    | "import"
    | "export"
    | "upload"
    | "download";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  device?: {
    browser: string;
    os: string;
    type: "desktop" | "mobile" | "tablet" | "unknown";
  };
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
      enum: [
        "create",
        "update",
        "delete",
        "activate",
        "deactivate",
        "login",
        "login_failed",
        "logout",
        "view",
        "reorder",
        "import",
        "export",
        "upload",
        "download",
      ],
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
    device: {
      browser: String,
      os: String,
      type: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
      },
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

// Force re-register model to pick up schema changes (safe for both dev HMR and production)
export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog
    ? (mongoose.deleteModel("ActivityLog"), mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema))
    : mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
