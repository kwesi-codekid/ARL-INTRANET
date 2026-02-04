/**
 * Chat Models for AI Chatbot
 * Task: 1.4.1.1.2 - Create ChatMessage schema
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// Chat Session Interface
export interface IChatSession extends Document {
  _id: Types.ObjectId;
  sessionId: string; // UUID for anonymous sessions
  userId?: string; // Optional user identifier
  messageCount: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Message Interface
export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  session: Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

// FAQ Interface for knowledge base
export interface IFAQ extends Document {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Session Schema
const ChatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Chat Message Schema
const ChatMessageSchema = new Schema<IChatMessage>(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// FAQ Schema
const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Indexes
ChatSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 }); // Auto-delete after 24 hours
ChatMessageSchema.index({ session: 1, createdAt: 1 });
FAQSchema.index({ question: "text", answer: "text", keywords: "text" });
FAQSchema.index({ isActive: 1, category: 1, order: 1 });

export const ChatSession: Model<IChatSession> =
  mongoose.models.ChatSession || mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);

export const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export const FAQ: Model<IFAQ> =
  mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", FAQSchema);
