/**
 * Safety Tips & Videos Service
 * Task: 1.2.2.1.4-9 (Backend Development)
 */

import { SafetyCategory, type ISafetyCategory } from "~/lib/db/models/safety-category.server";
import { SafetyTip, type ISafetyTip } from "~/lib/db/models/safety-tip.server";
import { SafetyVideo, type ISafetyVideo } from "~/lib/db/models/safety-video.server";

// ============================================
// Category Operations
// ============================================

export interface SafetyCategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
  scope?: "safety" | "training" | "both";
}

export async function createSafetyCategory(data: SafetyCategoryInput): Promise<ISafetyCategory> {
  const category = new SafetyCategory(data);
  await category.save();
  return category;
}

export async function updateSafetyCategory(
  id: string,
  data: Partial<SafetyCategoryInput>
): Promise<ISafetyCategory | null> {
  return SafetyCategory.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteSafetyCategory(id: string): Promise<boolean> {
  const result = await SafetyCategory.findByIdAndDelete(id);
  return !!result;
}

export async function getSafetyCategories(
  activeOnly = true,
  scope?: "safety" | "training"
): Promise<ISafetyCategory[]> {
  const filter: Record<string, unknown> = {};
  if (activeOnly) filter.isActive = true;
  if (scope) filter.scope = { $in: [scope, "both"] };
  return SafetyCategory.find(filter).sort({ order: 1, name: 1 });
}

export async function getSafetyCategoryById(id: string): Promise<ISafetyCategory | null> {
  return SafetyCategory.findById(id);
}

export async function getSafetyCategoryBySlug(slug: string): Promise<ISafetyCategory | null> {
  return SafetyCategory.findOne({ slug: slug.toLowerCase() });
}

// ============================================
// Safety Tip Operations - Task: 1.2.2.1.4, 1.2.2.1.6
// ============================================

export interface SafetyTipInput {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: string;
  author: string;
  featuredImage?: string;
  documentUrl?: string;
  icon?: string;
  status?: "draft" | "published" | "archived";
  isFeatured?: boolean;
  showInSlideshow?: boolean;
}

export async function createSafetyTip(data: SafetyTipInput): Promise<ISafetyTip> {
  const tip = new SafetyTip(data);
  await tip.save();
  return tip.populate(["category", "author"]);
}

export async function updateSafetyTip(
  id: string,
  data: Partial<SafetyTipInput>
): Promise<ISafetyTip | null> {
  const tip = await SafetyTip.findByIdAndUpdate(id, data, { new: true });
  return tip?.populate(["category", "author"]) || null;
}

export async function deleteSafetyTip(id: string): Promise<boolean> {
  const result = await SafetyTip.findByIdAndDelete(id);
  return !!result;
}

export async function getSafetyTipById(id: string): Promise<ISafetyTip | null> {
  return SafetyTip.findById(id).populate(["category", "author"]);
}

export async function getSafetyTipBySlug(slug: string): Promise<ISafetyTip | null> {
  return SafetyTip.findOne({ slug: slug.toLowerCase() }).populate(["category", "author"]);
}

// Task: 1.2.2.1.4 - GET /api/safety-tips endpoint
export interface GetSafetyTipsOptions {
  status?: "draft" | "published" | "archived";
  category?: string;
  search?: string;
  isFeatured?: boolean;
  showInSlideshow?: boolean;
  page?: number;
  limit?: number;
  includeAll?: boolean;
}

export interface PaginatedSafetyTips {
  tips: ISafetyTip[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getSafetyTips(options: GetSafetyTipsOptions = {}): Promise<PaginatedSafetyTips> {
  const filter: Record<string, unknown> = {};
  const page = options.page || 1;
  const limit = options.limit || 20;

  if (!options.includeAll) {
    filter.status = options.status || "published";
  } else if (options.status) {
    filter.status = options.status;
  }

  if (options.category) {
    filter.category = options.category;
  }

  if (options.isFeatured !== undefined) {
    filter.isFeatured = options.isFeatured;
  }

  if (options.showInSlideshow !== undefined) {
    filter.showInSlideshow = options.showInSlideshow;
  }

  if (options.search) {
    filter.$or = [
      { title: { $regex: options.search, $options: "i" } },
      { content: { $regex: options.search, $options: "i" } },
      { summary: { $regex: options.search, $options: "i" } },
    ];
  }

  const [tips, total] = await Promise.all([
    SafetyTip.find(filter)
      .populate(["category", "author"])
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SafetyTip.countDocuments(filter),
  ]);

  return {
    tips,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Task: 1.2.2.1.9 - Implement random tip of the day endpoint
export async function getRandomSafetyTip(): Promise<ISafetyTip | null> {
  const count = await SafetyTip.countDocuments({ status: "published" });
  if (count === 0) return null;

  const random = Math.floor(Math.random() * count);
  const tips = await SafetyTip.find({ status: "published" })
    .populate(["category", "author"])
    .skip(random)
    .limit(1);

  return tips[0] || null;
}

// Get tip of the day (deterministic based on date)
export async function getTipOfTheDay(): Promise<ISafetyTip | null> {
  const tips = await SafetyTip.find({ status: "published" })
    .populate(["category", "author"])
    .sort({ createdAt: 1 });

  if (tips.length === 0) return null;

  // Use day of year to select tip
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  return tips[dayOfYear % tips.length];
}

// ============================================
// Safety Video Operations - Task: 1.2.2.1.5, 1.2.2.1.7
// ============================================

export interface SafetyVideoInput {
  title: string;
  slug: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  duration?: number;
  category?: string;
  author: string;
  videoType?: "safety" | "training";
  status?: "draft" | "published" | "archived";
  isFeatured?: boolean;
  showInSlideshow?: boolean;
}

export async function createSafetyVideo(data: SafetyVideoInput): Promise<ISafetyVideo> {
  const video = new SafetyVideo(data);
  await video.save();
  return video.populate(["category", "author"]);
}

export async function updateSafetyVideo(
  id: string,
  data: Partial<SafetyVideoInput>
): Promise<ISafetyVideo | null> {
  const video = await SafetyVideo.findByIdAndUpdate(id, data, { new: true });
  return video?.populate(["category", "author"]) || null;
}

export async function deleteSafetyVideo(id: string): Promise<boolean> {
  const result = await SafetyVideo.findByIdAndDelete(id);
  return !!result;
}

export async function getSafetyVideoById(id: string): Promise<ISafetyVideo | null> {
  return SafetyVideo.findById(id).populate(["category", "author"]);
}

export async function getSafetyVideoBySlug(slug: string): Promise<ISafetyVideo | null> {
  return SafetyVideo.findOne({ slug: slug.toLowerCase() }).populate(["category", "author"]);
}

// Task: 1.2.2.1.5 - GET /api/safety-videos endpoint
export interface GetSafetyVideosOptions {
  status?: "draft" | "published" | "archived";
  category?: string;
  search?: string;
  isFeatured?: boolean;
  showInSlideshow?: boolean;
  videoType?: "safety" | "training";
  page?: number;
  limit?: number;
  includeAll?: boolean;
}

export interface PaginatedSafetyVideos {
  videos: ISafetyVideo[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getSafetyVideos(options: GetSafetyVideosOptions = {}): Promise<PaginatedSafetyVideos> {
  const filter: Record<string, unknown> = {};
  const page = options.page || 1;
  const limit = options.limit || 20;

  if (!options.includeAll) {
    filter.status = options.status || "published";
  } else if (options.status) {
    filter.status = options.status;
  }

  if (options.category) {
    filter.category = options.category;
  }

  if (options.isFeatured !== undefined) {
    filter.isFeatured = options.isFeatured;
  }

  if (options.showInSlideshow !== undefined) {
    filter.showInSlideshow = options.showInSlideshow;
  }

  if (options.videoType) {
    filter.videoType = options.videoType;
  }

  if (options.search) {
    filter.$or = [
      { title: { $regex: options.search, $options: "i" } },
      { description: { $regex: options.search, $options: "i" } },
    ];
  }

  const [videos, total] = await Promise.all([
    SafetyVideo.find(filter)
      .populate(["category", "author"])
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SafetyVideo.countDocuments(filter),
  ]);

  return {
    videos,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// Get featured video for homepage widget
export async function getFeaturedSafetyVideo(
  videoType: "safety" | "training" = "safety"
): Promise<ISafetyVideo | null> {
  return SafetyVideo.findOne({ status: "published", isFeatured: true, videoType })
    .populate(["category", "author"])
    .sort({ createdAt: -1 });
}

// ============================================
// Utilities
// ============================================

export async function incrementTipViews(id: string): Promise<void> {
  await SafetyTip.findByIdAndUpdate(id, { $inc: { views: 1 } });
}

export async function incrementVideoViews(id: string): Promise<void> {
  await SafetyVideo.findByIdAndUpdate(id, { $inc: { views: 1 } });
}

export async function generateUniqueTipSlug(title: string): Promise<string> {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let counter = 0;
  let uniqueSlug = slug;

  while (await SafetyTip.findOne({ slug: uniqueSlug })) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

export async function generateUniqueVideoSlug(title: string): Promise<string> {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let counter = 0;
  let uniqueSlug = slug;

  while (await SafetyVideo.findOne({ slug: uniqueSlug })) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

export async function generateUniqueCategorySlug(name: string): Promise<string> {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let counter = 0;
  let uniqueSlug = slug;

  while (await SafetyCategory.findOne({ slug: uniqueSlug })) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

// Stats for admin dashboard
export async function getSafetyStats(): Promise<{
  totalTips: number;
  publishedTips: number;
  totalVideos: number;
  publishedVideos: number;
  totalCategories: number;
  totalViews: number;
}> {
  const [
    totalTips,
    publishedTips,
    totalVideos,
    publishedVideos,
    totalCategories,
    tipViews,
    videoViews,
  ] = await Promise.all([
    SafetyTip.countDocuments(),
    SafetyTip.countDocuments({ status: "published" }),
    SafetyVideo.countDocuments(),
    SafetyVideo.countDocuments({ status: "published" }),
    SafetyCategory.countDocuments({ isActive: true }),
    SafetyTip.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    SafetyVideo.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
  ]);

  return {
    totalTips,
    publishedTips,
    totalVideos,
    publishedVideos,
    totalCategories,
    totalViews: (tipViews[0]?.total || 0) + (videoViews[0]?.total || 0),
  };
}

// ============================================
// Serialization Helpers
// ============================================

export interface SerializedSafetyCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  scope: "safety" | "training" | "both";
}

export function serializeSafetyCategory(category: ISafetyCategory): SerializedSafetyCategory {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description || "",
    icon: category.icon || "",
    color: category.color || "#10B981",
    order: category.order,
    isActive: category.isActive,
    scope: category.scope || "safety",
  };
}

export interface SerializedSafetyTip {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: SerializedSafetyCategory | null;
  featuredImage: string;
  documentUrl: string;
  icon: string;
  status: string;
  isFeatured: boolean;
  showInSlideshow: boolean;
  views: number;
  author: { name: string } | null;
  createdAt: string;
}

export function serializeSafetyTip(tip: ISafetyTip): SerializedSafetyTip {
  return {
    id: tip._id.toString(),
    title: tip.title,
    slug: tip.slug,
    content: tip.content,
    summary: tip.summary || tip.content.substring(0, 150) + "...",
    category: tip.category ? serializeSafetyCategory(tip.category as unknown as ISafetyCategory) : null,
    featuredImage: tip.featuredImage || "",
    documentUrl: tip.documentUrl || "",
    icon: tip.icon || "",
    status: tip.status,
    isFeatured: tip.isFeatured,
    showInSlideshow: tip.showInSlideshow || false,
    views: tip.views,
    author: tip.author ? { name: (tip.author as { name?: string }).name || "Unknown" } : null,
    createdAt: tip.createdAt.toISOString(),
  };
}

export interface SerializedSafetyVideo {
  id: string;
  title: string;
  slug: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  category: SerializedSafetyCategory | null;
  videoType: "safety" | "training";
  status: string;
  isFeatured: boolean;
  showInSlideshow: boolean;
  views: number;
  author: { name: string } | null;
  createdAt: string;
}

export function serializeSafetyVideo(video: ISafetyVideo): SerializedSafetyVideo {
  return {
    id: video._id.toString(),
    title: video.title,
    slug: video.slug,
    description: video.description,
    videoUrl: video.videoUrl,
    thumbnail: video.thumbnail || "",
    duration: video.duration || 0,
    category: video.category ? serializeSafetyCategory(video.category as unknown as ISafetyCategory) : null,
    videoType: video.videoType || "safety",
    status: video.status,
    isFeatured: video.isFeatured,
    showInSlideshow: video.showInSlideshow || false,
    views: video.views,
    author: video.author ? { name: (video.author as { name?: string }).name || "Unknown" } : null,
    createdAt: video.createdAt.toISOString(),
  };
}

// Get items marked for slideshow display
export async function getSlideshowItems(): Promise<{
  videos: ISafetyVideo[];
  tips: ISafetyTip[];
}> {
  const [videos, tips] = await Promise.all([
    SafetyVideo.find({ status: "published", showInSlideshow: true, videoType: "safety" })
      .populate(["category", "author"])
      .sort({ createdAt: -1 })
      .limit(10),
    SafetyTip.find({ status: "published", showInSlideshow: true })
      .populate(["category", "author"])
      .sort({ createdAt: -1 })
      .limit(10),
  ]);
  return { videos, tips };
}
