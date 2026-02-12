/**
 * AppLink Service
 * Task: 1.1.5.1.2, 1.1.5.2.2
 */

import { AppLink, type IAppLink } from "~/lib/db/models/app-link.server";

// ============================================
// AppLink Functions
// ============================================

export interface AppLinkInput {
  name: string;
  description?: string;
  url: string;
  icon?: string;
  iconType?: "url" | "lucide" | "emoji";
  isInternal?: boolean;
  isActive?: boolean;
  order?: number;
}

export async function createAppLink(data: AppLinkInput): Promise<IAppLink> {
  const appLink = new AppLink(data);
  await appLink.save();
  return appLink;
}

export async function updateAppLink(
  id: string,
  data: Partial<AppLinkInput>
): Promise<IAppLink | null> {
  return AppLink.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteAppLink(id: string): Promise<boolean> {
  const result = await AppLink.findByIdAndDelete(id);
  return !!result;
}

export async function getAppLinkById(id: string): Promise<IAppLink | null> {
  return AppLink.findById(id);
}

export interface GetAppLinksOptions {
  search?: string;
  isActive?: boolean;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedAppLinks {
  appLinks: IAppLink[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getAppLinks(options: GetAppLinksOptions = {}): Promise<PaginatedAppLinks> {
  const filter: Record<string, unknown> = {};
  const page = options.page || 1;
  const limit = options.limit || 50;

  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: "i" } },
      { description: { $regex: options.search, $options: "i" } },
    ];
  }

  if (!options.includeInactive) {
    filter.isActive = true;
  } else if (options.isActive !== undefined) {
    filter.isActive = options.isActive;
  }

  const [appLinks, total] = await Promise.all([
    AppLink.find(filter)
      .sort({ order: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AppLink.countDocuments(filter),
  ]);

  return {
    appLinks,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAllActiveAppLinks(): Promise<IAppLink[]> {
  return AppLink.find({ isActive: true }).sort({ order: 1, name: 1 });
}

export async function searchAppLinks(query: string, limit = 10): Promise<IAppLink[]> {
  return AppLink.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  })
    .sort({ order: 1, name: 1 })
    .limit(limit);
}

export async function incrementClicks(id: string): Promise<void> {
  await AppLink.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
}

export async function getAppLinkStats(): Promise<{
  total: number;
  active: number;
  totalClicks: number;
  topLinks: Array<{ name: string; clicks: number }>;
}> {
  const [total, active, clicksResult, topLinks] = await Promise.all([
    AppLink.countDocuments(),
    AppLink.countDocuments({ isActive: true }),
    AppLink.aggregate([
      { $group: { _id: null, totalClicks: { $sum: "$clicks" } } },
    ]),
    AppLink.find({ isActive: true })
      .select("name clicks")
      .sort({ clicks: -1 })
      .limit(5),
  ]);

  return {
    total,
    active,
    totalClicks: clicksResult[0]?.totalClicks || 0,
    topLinks: topLinks.map((l) => ({ name: l.name, clicks: l.clicks })),
  };
}

// ============================================
// Reorder App Links
// Task: 1.1.5.3.4
// ============================================

export async function reorderAppLinks(
  orderedIds: string[]
): Promise<void> {
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }));

  await AppLink.bulkWrite(bulkOps);
}
