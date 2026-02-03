/**
 * Executive Message Service
 * Task: CEO Talk Slideshow - CRUD operations for executive messages
 */

import { connectDB } from "~/lib/db/connection.server";
import { ExecutiveMessage, type IExecutiveMessage } from "~/lib/db/models/executive-message.server";
import type { Types } from "mongoose";

// Get active executive messages (for public display)
export async function getActiveExecutiveMessages(): Promise<IExecutiveMessage[]> {
  await connectDB();

  return ExecutiveMessage.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();
}

// Get all executive messages (admin)
export async function getAllExecutiveMessages(): Promise<IExecutiveMessage[]> {
  await connectDB();

  return ExecutiveMessage.find()
    .sort({ order: 1, createdAt: -1 })
    .populate("createdBy", "name")
    .lean();
}

// Get single executive message
export async function getExecutiveMessageById(id: string): Promise<IExecutiveMessage | null> {
  await connectDB();

  return ExecutiveMessage.findById(id).lean();
}

// Create executive message
export async function createExecutiveMessage(data: {
  name: string;
  title: string;
  photo: string;
  message: string;
  isActive?: boolean;
  order?: number;
  createdBy: string;
}): Promise<IExecutiveMessage> {
  await connectDB();

  // Get the highest order value
  const lastMessage = await ExecutiveMessage.findOne().sort({ order: -1 });
  const order = data.order ?? (lastMessage ? lastMessage.order + 1 : 0);

  return ExecutiveMessage.create({
    name: data.name,
    title: data.title,
    photo: data.photo,
    message: data.message,
    isActive: data.isActive ?? true,
    order,
    createdBy: data.createdBy as unknown as Types.ObjectId,
  });
}

// Update executive message
export async function updateExecutiveMessage(
  id: string,
  data: Partial<{
    name: string;
    title: string;
    photo: string;
    message: string;
    isActive: boolean;
    order: number;
  }>
): Promise<IExecutiveMessage | null> {
  await connectDB();

  return ExecutiveMessage.findByIdAndUpdate(id, data, { new: true }).lean();
}

// Delete executive message
export async function deleteExecutiveMessage(id: string): Promise<boolean> {
  await connectDB();

  const result = await ExecutiveMessage.findByIdAndDelete(id);
  return !!result;
}

// Toggle active status
export async function toggleExecutiveMessageActive(id: string): Promise<IExecutiveMessage | null> {
  await connectDB();

  const message = await ExecutiveMessage.findById(id);
  if (!message) return null;

  message.isActive = !message.isActive;
  await message.save();

  return message.toObject();
}

// Reorder executive messages
export async function reorderExecutiveMessages(orderedIds: string[]): Promise<void> {
  await connectDB();

  await Promise.all(
    orderedIds.map((id, index) =>
      ExecutiveMessage.findByIdAndUpdate(id, { order: index })
    )
  );
}
