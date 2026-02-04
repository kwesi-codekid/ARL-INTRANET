/**
 * Event Model
 * Task: 1.3.1.1 - Events Backend
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  content?: string;
  date: Date;
  endDate?: Date;
  time?: string;
  location: string;
  locationDetails?: string;
  featuredImage?: string;
  images: string[];
  category?: string;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationRequired: boolean;
  registrationLink?: string;
  maxAttendees?: number;
  status: "draft" | "published" | "cancelled" | "completed";
  isFeatured: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
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
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
    },
    time: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    locationDetails: {
      type: String,
      trim: true,
    },
    featuredImage: {
      type: String,
    },
    images: [{
      type: String,
    }],
    category: {
      type: String,
      trim: true,
    },
    organizer: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    registrationRequired: {
      type: Boolean,
      default: false,
    },
    registrationLink: {
      type: String,
      trim: true,
    },
    maxAttendees: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
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

// Indexes for common queries
EventSchema.index({ status: 1, date: -1 });
EventSchema.index({ date: 1, status: 1 });
EventSchema.index({ isFeatured: 1, status: 1, date: -1 });
EventSchema.index({ title: "text", description: "text" });

// Virtual to check if event is upcoming
EventSchema.virtual("isUpcoming").get(function () {
  return this.date > new Date();
});

// Virtual to check if event is past
EventSchema.virtual("isPast").get(function () {
  const endDate = this.endDate || this.date;
  return endDate < new Date();
});

export const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
