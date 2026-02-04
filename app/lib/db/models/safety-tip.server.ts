import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// Task: 1.2.2.1.1 - Create SafetyTip schema (title, content, category, media)

export interface ISafetyTip extends Document {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: Types.ObjectId;
  author: Types.ObjectId;
  featuredImage?: string;
  documentUrl?: string; // PDF document URL
  icon?: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  showInSlideshow: boolean; // Admin controls if this appears in homepage slideshow
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyTipSchema = new Schema<ISafetyTip>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "SafetyCategory",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    featuredImage: {
      type: String,
      trim: true,
    },
    documentUrl: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    showInSlideshow: {
      type: Boolean,
      default: false,
      index: true,
    },
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
SafetyTipSchema.index({ status: 1, createdAt: -1 });
SafetyTipSchema.index({ category: 1, status: 1 });
SafetyTipSchema.index({ title: "text", content: "text" });

export const SafetyTip: Model<ISafetyTip> =
  mongoose.models.SafetyTip || mongoose.model<ISafetyTip>("SafetyTip", SafetyTipSchema);
