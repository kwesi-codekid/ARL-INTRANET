/**
 * IT Tip Service
 * Task: IT Tips Feature - CRUD operations for IT tips
 */

import { connectDB } from "~/lib/db/connection.server";
import { ITTip, type IITTip } from "~/lib/db/models/it-tip.server";
import type { Types } from "mongoose";

// Get active IT tips for display (public)
export async function getActiveITTips(limit: number = 5): Promise<IITTip[]> {
  await connectDB();

  return ITTip.find({ isActive: true })
    .sort({ isPinned: -1, order: 1, createdAt: -1 })
    .limit(limit)
    .lean();
}

// Get IT tips by category
export async function getITTipsByCategory(category: string): Promise<IITTip[]> {
  await connectDB();

  return ITTip.find({ isActive: true, category })
    .sort({ isPinned: -1, order: 1, createdAt: -1 })
    .lean();
}

// Get all IT tips (admin)
export async function getAllITTips(): Promise<IITTip[]> {
  await connectDB();

  return ITTip.find()
    .sort({ isPinned: -1, isActive: -1, order: 1, createdAt: -1 })
    .populate("createdBy", "name")
    .lean();
}

// Get single IT tip
export async function getITTipById(id: string): Promise<IITTip | null> {
  await connectDB();

  return ITTip.findById(id).lean();
}

// Create IT tip
export async function createITTip(data: {
  title: string;
  content: string;
  icon?: string;
  category: string;
  isActive?: boolean;
  isPinned?: boolean;
  createdBy: string;
}): Promise<IITTip> {
  await connectDB();

  return ITTip.create({
    title: data.title,
    content: data.content,
    icon: data.icon || "lightbulb",
    category: data.category,
    isActive: data.isActive ?? true,
    isPinned: data.isPinned ?? false,
    createdBy: data.createdBy as unknown as Types.ObjectId,
  });
}

// Update IT tip
export async function updateITTip(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    icon: string;
    category: string;
    isActive: boolean;
    isPinned: boolean;
    order: number;
  }>
): Promise<IITTip | null> {
  await connectDB();

  return ITTip.findByIdAndUpdate(id, data, { new: true }).lean();
}

// Delete IT tip
export async function deleteITTip(id: string): Promise<boolean> {
  await connectDB();

  const result = await ITTip.findByIdAndDelete(id);
  return !!result;
}

// Toggle active status
export async function toggleITTipActive(id: string): Promise<IITTip | null> {
  await connectDB();

  const tip = await ITTip.findById(id);
  if (!tip) return null;

  tip.isActive = !tip.isActive;
  await tip.save();

  return tip.toObject();
}

// Toggle pinned status
export async function toggleITTipPinned(id: string): Promise<IITTip | null> {
  await connectDB();

  const tip = await ITTip.findById(id);
  if (!tip) return null;

  tip.isPinned = !tip.isPinned;
  await tip.save();

  return tip.toObject();
}

// Get tip categories
export function getITTipCategories(): { value: string; label: string }[] {
  return [
    { value: "security", label: "Security" },
    { value: "productivity", label: "Productivity" },
    { value: "shortcuts", label: "Keyboard Shortcuts" },
    { value: "software", label: "Software" },
    { value: "hardware", label: "Hardware" },
    { value: "general", label: "General" },
  ];
}
