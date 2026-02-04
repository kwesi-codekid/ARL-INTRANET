/**
 * Settings Model
 * System-wide configuration stored in database
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface ISettings extends Document {
  key: string;
  value: any;
  type: "string" | "number" | "boolean" | "json";
  category: "general" | "notifications" | "security" | "system";
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "json"],
      default: "string",
    },
    category: {
      type: String,
      enum: ["general", "notifications", "security", "system"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

// Default settings configuration
export const DEFAULT_SETTINGS = {
  // General
  siteName: { value: "ARL Intranet", type: "string", category: "general", description: "Site name displayed in header" },
  siteDescription: { value: "Adamus Resources Limited Intranet Portal", type: "string", category: "general", description: "Site description" },
  maintenanceMode: { value: false, type: "boolean", category: "general", description: "Enable maintenance mode" },
  maintenanceMessage: { value: "The site is currently under maintenance. Please check back later.", type: "string", category: "general", description: "Message shown during maintenance" },

  // Notifications
  emailNotificationsEnabled: { value: true, type: "boolean", category: "notifications", description: "Enable email notifications" },
  smsNotificationsEnabled: { value: true, type: "boolean", category: "notifications", description: "Enable SMS notifications" },
  adminEmailRecipients: { value: "", type: "string", category: "notifications", description: "Comma-separated admin email addresses" },

  // Security
  sessionTimeoutHours: { value: 24, type: "number", category: "security", description: "Session timeout in hours" },
  maxLoginAttempts: { value: 5, type: "number", category: "security", description: "Max failed login attempts before lockout" },
  lockoutDurationMinutes: { value: 30, type: "number", category: "security", description: "Account lockout duration in minutes" },
  otpExpiryMinutes: { value: 5, type: "number", category: "security", description: "OTP expiry time in minutes" },

  // System
  cacheEnabled: { value: true, type: "boolean", category: "system", description: "Enable caching" },
  debugMode: { value: false, type: "boolean", category: "system", description: "Enable debug mode" },
} as const;

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
