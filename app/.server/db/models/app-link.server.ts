import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * App link categories
 */
export const APP_LINK_CATEGORIES = [
  "business",
  "hr",
  "safety",
  "communication",
  "productivity",
  "other",
] as const;
export type AppLinkCategory = (typeof APP_LINK_CATEGORIES)[number];

/**
 * Icon types
 */
export const ICON_TYPES = ["lucide", "custom", "image"] as const;
export type IconType = (typeof ICON_TYPES)[number];

/**
 * AppLink document interface
 */
export interface IAppLink {
  name: string;
  url: string;
  description?: string;
  icon: string;
  iconType: IconType;
  iconUrl?: string;
  category: AppLinkCategory;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  requiresAuth: boolean;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AppLink document with Mongoose Document methods
 */
export interface IAppLinkDocument extends IAppLink, Document {}

/**
 * AppLink model static methods
 */
export interface IAppLinkModel extends Model<IAppLinkDocument> {
  findByCategory(
    category: AppLinkCategory
  ): mongoose.Query<IAppLinkDocument[], IAppLinkDocument>;
  findActive(): mongoose.Query<IAppLinkDocument[], IAppLinkDocument>;
  incrementClickCount(id: mongoose.Types.ObjectId): Promise<IAppLinkDocument | null>;
}

/**
 * AppLink schema definition
 */
const appLinkSchema = new Schema<IAppLinkDocument, IAppLinkModel>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      required: [true, "Icon is required"],
      default: "link",
    },
    iconType: {
      type: String,
      enum: {
        values: ICON_TYPES,
        message: "{VALUE} is not a valid icon type",
      },
      default: "lucide",
    },
    iconUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: APP_LINK_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      default: "other",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isExternal: {
      type: Boolean,
      default: true,
    },
    requiresAuth: {
      type: Boolean,
      default: false,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
appLinkSchema.index({ category: 1, order: 1 });
appLinkSchema.index({ isActive: 1 });

/**
 * Static method: Find links by category
 */
appLinkSchema.statics.findByCategory = function (category: AppLinkCategory) {
  return this.find({ category, isActive: true }).sort({ order: 1 });
};

/**
 * Static method: Find all active links
 */
appLinkSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ category: 1, order: 1 });
};

/**
 * Static method: Increment click count
 */
appLinkSchema.statics.incrementClickCount = function (
  id: mongoose.Types.ObjectId
): Promise<IAppLinkDocument | null> {
  return this.findByIdAndUpdate(id, { $inc: { clickCount: 1 } }, { new: true });
};

/**
 * AppLink model
 */
export const AppLink =
  (mongoose.models.AppLink as IAppLinkModel) ||
  mongoose.model<IAppLinkDocument, IAppLinkModel>("AppLink", appLinkSchema);
