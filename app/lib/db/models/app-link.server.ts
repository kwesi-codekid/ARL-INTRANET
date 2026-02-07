import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface IAppLink extends Document {
  name: string;
  description?: string;
  url: string;
  icon?: string;
  iconType: "url" | "lucide" | "emoji";
  isInternal: boolean;
  isActive: boolean;
  order: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppLinkSchema = new Schema<IAppLink>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
    },
    iconType: {
      type: String,
      enum: ["url", "lucide", "emoji"],
      default: "lucide",
    },
    isInternal: {
      type: Boolean,
      default: false,
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
    clicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
AppLinkSchema.index({ isActive: 1, order: 1 });
AppLinkSchema.index({ name: "text", description: "text" });

export const AppLink: Model<IAppLink> =
  mongoose.models.AppLink || mongoose.model<IAppLink>("AppLink", AppLinkSchema);
