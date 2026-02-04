import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// Task: 1.2.1.1.1 - Create ToolboxTalk schema (title, content, date, media, author)

export interface IMediaItem {
  type: "image" | "video" | "audio";
  url: string;
  thumbnail?: string;
  duration?: number; // in seconds, for video/audio
  caption?: string;
}

export interface IToolboxTalk extends Document {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  author: Types.ObjectId;
  media: IMediaItem[];
  featuredMedia?: IMediaItem;
  scheduledDate: Date;
  status: "draft" | "published" | "archived";
  tags: string[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    duration: {
      type: Number,
    },
    caption: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const ToolboxTalkSchema = new Schema<IToolboxTalk>(
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
    summary: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    media: [MediaItemSchema],
    featuredMedia: MediaItemSchema,
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
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
// Task: 1.1.1.2.8 - Set up database indexing for performance
ToolboxTalkSchema.index({ status: 1, scheduledDate: -1 });
ToolboxTalkSchema.index({ scheduledDate: 1 }); // For "today's talk" queries
ToolboxTalkSchema.index({ title: "text", content: "text" });

export const ToolboxTalk: Model<IToolboxTalk> =
  mongoose.models.ToolboxTalk || mongoose.model<IToolboxTalk>("ToolboxTalk", ToolboxTalkSchema);
