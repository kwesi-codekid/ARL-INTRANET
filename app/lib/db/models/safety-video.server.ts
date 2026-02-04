import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// Task: 1.2.2.1.2 - Create SafetyVideo schema (title, description, video, thumbnail)

export interface ISafetyVideo extends Document {
  title: string;
  slug: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  duration?: number; // in seconds
  category: Types.ObjectId;
  author: Types.ObjectId;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  showInSlideshow: boolean; // Admin controls if this appears in homepage slideshow
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyVideoSchema = new Schema<ISafetyVideo>(
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
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
SafetyVideoSchema.index({ status: 1, createdAt: -1 });
SafetyVideoSchema.index({ category: 1, status: 1 });
SafetyVideoSchema.index({ title: "text", description: "text" });

export const SafetyVideo: Model<ISafetyVideo> =
  mongoose.models.SafetyVideo || mongoose.model<ISafetyVideo>("SafetyVideo", SafetyVideoSchema);
