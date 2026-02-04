/**
 * Executive Message Model
 * Task: CEO Talk Slideshow - Multiple executives/managers messages
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Types, Model } from "mongoose";

export interface IExecutiveMessage extends Document {
  _id: Types.ObjectId;
  name: string;
  title: string;
  photo: string;
  message: string;
  isActive: boolean;
  order: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutiveMessageSchema = new Schema<IExecutiveMessage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ExecutiveMessageSchema.index({ isActive: 1, order: 1 });

export const ExecutiveMessage: Model<IExecutiveMessage> =
  mongoose.models.ExecutiveMessage ||
  mongoose.model<IExecutiveMessage>("ExecutiveMessage", ExecutiveMessageSchema);
