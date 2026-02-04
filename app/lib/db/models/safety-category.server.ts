import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

// Task: 1.2.2.1.3 - Create SafetyCategory schema

export interface ISafetyCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyCategorySchema = new Schema<ISafetyCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: "#10B981", // green-500
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SafetyCategorySchema.index({ order: 1 });
SafetyCategorySchema.index({ isActive: 1 });

export const SafetyCategory: Model<ISafetyCategory> =
  mongoose.models.SafetyCategory || mongoose.model<ISafetyCategory>("SafetyCategory", SafetyCategorySchema);
