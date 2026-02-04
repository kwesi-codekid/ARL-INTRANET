import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// Task: 1.2.3.1.1 - Create Alert schema (title, message, severity, type, active, dates)

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType = "safety" | "incident" | "general" | "maintenance" | "weather";

export interface IAlertAcknowledgment {
  visitorId: string; // hashed IP or session ID
  acknowledgedAt: Date;
}

export interface IAlert extends Document {
  title: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  isActive: boolean;
  isPinned: boolean;
  showPopup: boolean;
  showBanner: boolean;
  playSound: boolean;
  startDate?: Date;
  endDate?: Date;
  author: Types.ObjectId;
  acknowledgments: IAlertAcknowledgment[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlertAcknowledgmentSchema = new Schema<IAlertAcknowledgment>(
  {
    visitorId: {
      type: String,
      required: true,
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AlertSchema = new Schema<IAlert>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true,
    },
    type: {
      type: String,
      enum: ["safety", "incident", "general", "maintenance", "weather"],
      default: "general",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    showPopup: {
      type: Boolean,
      default: true,
    },
    showBanner: {
      type: Boolean,
      default: true,
    },
    playSound: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    acknowledgments: [AlertAcknowledgmentSchema],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
AlertSchema.index({ isActive: 1, severity: 1 });
AlertSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
AlertSchema.index({ createdAt: -1 });

export const Alert: Model<IAlert> =
  mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
