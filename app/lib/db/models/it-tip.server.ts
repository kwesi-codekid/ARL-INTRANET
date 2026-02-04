/**
 * IT Tip Model
 * Task: IT Tips Feature - Small cards for IT tips that admins can push out
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Types, Model } from "mongoose";

export interface IITTip extends Document {
  _id: Types.ObjectId;
  title: string;
  content: string;
  icon?: string;
  category: string;
  isActive: boolean;
  isPinned: boolean;
  order: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ITTipSchema = new Schema<IITTip>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: "lightbulb",
    },
    category: {
      type: String,
      required: true,
      enum: ["security", "productivity", "shortcuts", "software", "hardware", "general"],
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ITTipSchema.index({ isActive: 1, order: 1 });
ITTipSchema.index({ category: 1 });
ITTipSchema.index({ isPinned: -1, createdAt: -1 });

export const ITTip: Model<IITTip> =
  mongoose.models.ITTip || mongoose.model<IITTip>("ITTip", ITTipSchema);
