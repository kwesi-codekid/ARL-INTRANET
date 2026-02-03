import mongoose, { Document, Schema, Types } from "mongoose";

// Policy Category Interface
export interface IPolicyCategory extends Document {
  _id: Types.ObjectId;
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

// Policy Interface
export interface IPolicy extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  category: Types.ObjectId;
  pdfUrl?: string;
  pdfFileName?: string;
  effectiveDate?: Date;
  version?: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  views: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Policy Category Schema
const PolicyCategorySchema = new Schema<IPolicyCategory>(
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
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: "#d2ab67",
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

// Policy Category Indexes
PolicyCategorySchema.index({ slug: 1 });
PolicyCategorySchema.index({ isActive: 1, order: 1 });

// Policy Schema
const PolicySchema = new Schema<IPolicy>(
  {
    title: {
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
    content: {
      type: String,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "PolicyCategory",
      required: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    pdfFileName: {
      type: String,
      trim: true,
    },
    effectiveDate: {
      type: Date,
    },
    version: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Policy Indexes
PolicySchema.index({ slug: 1 });
PolicySchema.index({ status: 1, publishedAt: -1 });
PolicySchema.index({ category: 1, status: 1 });
PolicySchema.index({ isFeatured: 1, status: 1 });
PolicySchema.index({ title: "text", content: "text" });

export const PolicyCategory =
  mongoose.models.PolicyCategory ||
  mongoose.model<IPolicyCategory>("PolicyCategory", PolicyCategorySchema);

export const Policy =
  mongoose.models.Policy || mongoose.model<IPolicy>("Policy", PolicySchema);
