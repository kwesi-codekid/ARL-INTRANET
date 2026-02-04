/**
 * Gold Industry News Models
 * Task: 1.4.3.1.2 - Create ExternalNews schema
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// External News Interface
export interface IExternalNews extends Document {
  _id: Types.ObjectId;
  title: string;
  source: string;
  sourceUrl: string;
  url: string;
  summary?: string;
  imageUrl?: string;
  publishedAt: Date;
  region: "ghana" | "world";
  category: string;
  hash: string; // For deduplication
  createdAt: Date;
  updatedAt: Date;
}

// News Source Interface
export interface INewsSource extends Document {
  _id: Types.ObjectId;
  name: string;
  url: string;
  type: "rss" | "api";
  region: "ghana" | "world";
  category: string;
  isActive: boolean;
  lastFetched?: Date;
  lastError?: string;
  fetchInterval: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

// External News Schema
const ExternalNewsSchema = new Schema<IExternalNews>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    sourceUrl: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
    },
    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },
    region: {
      type: String,
      enum: ["ghana", "world"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "general",
      index: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// News Source Schema
const NewsSourceSchema = new Schema<INewsSource>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["rss", "api"],
      required: true,
    },
    region: {
      type: String,
      enum: ["ghana", "world"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastFetched: {
      type: Date,
    },
    lastError: {
      type: String,
    },
    fetchInterval: {
      type: Number,
      default: 60, // 1 hour default
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ExternalNewsSchema.index({ region: 1, publishedAt: -1 });
ExternalNewsSchema.index({ publishedAt: -1 });
ExternalNewsSchema.index({ title: "text", summary: "text" });
NewsSourceSchema.index({ isActive: 1, type: 1 });

export const ExternalNews: Model<IExternalNews> =
  mongoose.models.ExternalNews || mongoose.model<IExternalNews>("ExternalNews", ExternalNewsSchema);

export const NewsSource: Model<INewsSource> =
  mongoose.models.NewsSource || mongoose.model<INewsSource>("NewsSource", NewsSourceSchema);
