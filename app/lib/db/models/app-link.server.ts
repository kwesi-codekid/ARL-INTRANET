import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export interface IAppLinkCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppLink extends Document {
  name: string;
  description?: string;
  url: string;
  icon?: string;
  iconType: "url" | "lucide" | "emoji";
  category: mongoose.Types.ObjectId;
  isInternal: boolean;
  isActive: boolean;
  order: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppLinkCategorySchema = new Schema<IAppLinkCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    },
    isActive: {
      type: Boolean,
      default: true,
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
    category: {
      type: Schema.Types.ObjectId,
      ref: "AppLinkCategory",
      required: true,
      index: true,
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
AppLinkCategorySchema.index({ isActive: 1, order: 1 });

AppLinkSchema.index({ category: 1, isActive: 1, order: 1 });
AppLinkSchema.index({ name: "text", description: "text" });

export const AppLinkCategory: Model<IAppLinkCategory> =
  mongoose.models.AppLinkCategory || mongoose.model<IAppLinkCategory>("AppLinkCategory", AppLinkCategorySchema);

export const AppLink: Model<IAppLink> =
  mongoose.models.AppLink || mongoose.model<IAppLink>("AppLink", AppLinkSchema);
