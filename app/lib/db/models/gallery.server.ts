/**
 * Album and Photo Models
 * Task: 1.3.1.2 - Photo Gallery Backend
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAlbum extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  date: Date;
  event?: Types.ObjectId;
  photoCount: number;
  status: "draft" | "published";
  isFeatured: boolean;
  externalGalleryUrl?: string; // Link to external gallery (Google Drive, OneDrive, etc.)
  isExternalGallery: boolean; // If true, photos are hosted externally
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPhoto extends Document {
  _id: Types.ObjectId;
  album: Types.ObjectId;
  url: string;
  thumbnail?: string;
  caption?: string;
  order: number;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema = new Schema<IAlbum>(
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
      trim: true,
      maxlength: 500,
    },
    coverImage: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    photoCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    externalGalleryUrl: {
      type: String,
      trim: true,
    },
    isExternalGallery: {
      type: Boolean,
      default: false,
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

const PhotoSchema = new Schema<IPhoto>(
  {
    album: {
      type: Schema.Types.ObjectId,
      ref: "Album",
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    fileSize: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AlbumSchema.index({ status: 1, date: -1 });
AlbumSchema.index({ isFeatured: 1, status: 1 });
AlbumSchema.index({ title: "text", description: "text" });
PhotoSchema.index({ album: 1, order: 1 });

export const Album: Model<IAlbum> =
  mongoose.models.Album || mongoose.model<IAlbum>("Album", AlbumSchema);

export const Photo: Model<IPhoto> =
  mongoose.models.Photo || mongoose.model<IPhoto>("Photo", PhotoSchema);
