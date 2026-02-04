/**
 * Suggestion and SuggestionCategory Models
 * Task: 1.3.2.1 - Anonymous Suggestion Box Backend
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// Suggestion Category Interface
export interface ISuggestionCategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Suggestion Interface
export interface ISuggestion extends Document {
  _id: Types.ObjectId;
  content: string;
  category: Types.ObjectId;
  status: "new" | "reviewed" | "in_progress" | "resolved" | "archived";
  ipHash: string; // Hashed IP for traceability without storing raw IP
  adminNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Category Schema
const SuggestionCategorySchema = new Schema<ISuggestionCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Suggestion Schema
const SuggestionSchema = new Schema<ISuggestion>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "SuggestionCategory",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "in_progress", "resolved", "archived"],
      default: "new",
      index: true,
    },
    ipHash: {
      type: String,
      required: true,
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SuggestionCategorySchema.index({ isActive: 1, order: 1 });
SuggestionSchema.index({ status: 1, createdAt: -1 });
SuggestionSchema.index({ category: 1, status: 1 });
SuggestionSchema.index({ createdAt: -1 });

export const SuggestionCategory: Model<ISuggestionCategory> =
  mongoose.models.SuggestionCategory ||
  mongoose.model<ISuggestionCategory>("SuggestionCategory", SuggestionCategorySchema);

export const Suggestion: Model<ISuggestion> =
  mongoose.models.Suggestion ||
  mongoose.model<ISuggestion>("Suggestion", SuggestionSchema);
