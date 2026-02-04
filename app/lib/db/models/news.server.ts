import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface INewsCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INews extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: Types.ObjectId;
  author: Types.ObjectId;
  images: string[];
  featuredImage?: string;
  featuredVideo?: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  isPinned: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const NewsCategorySchema = new Schema<INewsCategory>(
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
    color: {
      type: String,
      default: "#D4AF37",
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

const NewsSchema = new Schema<INews>(
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
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "NewsCategory",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    images: [{
      type: String,
    }],
    featuredImage: {
      type: String,
    },
    featuredVideo: {
      type: String,
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
    isPinned: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    scheduledAt: {
      type: Date,
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
NewsSchema.index({ status: 1, publishedAt: -1 });
NewsSchema.index({ category: 1, status: 1, publishedAt: -1 });
NewsSchema.index({ isFeatured: 1, status: 1 });
NewsSchema.index({ title: "text", content: "text" });

export const NewsCategory: Model<INewsCategory> =
  mongoose.models.NewsCategory || mongoose.model<INewsCategory>("NewsCategory", NewsCategorySchema);

export const News: Model<INews> =
  mongoose.models.News || mongoose.model<INews>("News", NewsSchema);
