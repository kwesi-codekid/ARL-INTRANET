import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";

export interface ICompanyInfo extends Document {
  _id: Types.ObjectId;
  vision: string;
  mission: string;
  coreValues: {
    title: string;
    description: string;
    icon?: string;
  }[];
  // Image URLs for slideshow
  visionImage: string;
  missionImage: string;
  valuesImage: string;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CoreValueSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const CompanyInfoSchema = new Schema<ICompanyInfo>(
  {
    vision: {
      type: String,
      required: true,
      trim: true,
    },
    mission: {
      type: String,
      required: true,
      trim: true,
    },
    coreValues: {
      type: [CoreValueSchema],
      default: [],
    },
    // Image URLs for slideshow
    visionImage: {
      type: String,
      default: "/uploads/company/vision.png",
      trim: true,
    },
    missionImage: {
      type: String,
      default: "/uploads/company/mission.png",
      trim: true,
    },
    valuesImage: {
      type: String,
      default: "/uploads/company/values.png",
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  {
    timestamps: true,
  }
);

export const CompanyInfo =
  mongoose.models.CompanyInfo ||
  mongoose.model<ICompanyInfo>("CompanyInfo", CompanyInfoSchema);
