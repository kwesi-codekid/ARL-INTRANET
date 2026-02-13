/**
 * Suggestion Report Service
 * Aggregation queries for suggestion box analytics and export
 */

import { connectDB } from "~/lib/db/connection.server";
import {
  Suggestion,
  SuggestionCategory,
} from "~/lib/db/models/suggestion.server";

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  category?: string;
  status?: string;
}

function buildMatchStage(filters: ReportFilters) {
  const match: Record<string, unknown> = {
    createdAt: { $gte: filters.startDate, $lte: filters.endDate },
  };
  if (filters.category) match.category = filters.category;
  if (filters.status) match.status = filters.status;
  return match;
}

export async function getSuggestionReportStats(filters: ReportFilters) {
  await connectDB();

  const match = buildMatchStage(filters);
  const daysDiff =
    Math.max(
      1,
      Math.ceil(
        (filters.endDate.getTime() - filters.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

  const [result] = await Suggestion.aggregate([
    { $match: match },
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        peakDay: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ],
        avgResolution: [
          {
            $match: {
              status: "resolved",
              reviewedAt: { $exists: true, $ne: null },
            },
          },
          {
            $project: {
              resolutionMs: { $subtract: ["$reviewedAt", "$createdAt"] },
            },
          },
          { $group: { _id: null, avg: { $avg: "$resolutionMs" } } },
        ],
      },
    },
  ]);

  const total = result.total[0]?.count ?? 0;
  const avgPerDay = total / daysDiff;
  const peakDay = result.peakDay[0]
    ? { date: result.peakDay[0]._id, count: result.peakDay[0].count }
    : null;

  // Convert avg resolution from ms to hours
  const avgResolutionHours = result.avgResolution[0]
    ? result.avgResolution[0].avg / (1000 * 60 * 60)
    : null;

  const statusMap: Record<string, number> = {};
  for (const s of result.byStatus) {
    statusMap[s._id] = s.count;
  }

  return {
    total,
    avgPerDay: Math.round(avgPerDay * 10) / 10,
    peakDay,
    avgResolutionHours:
      avgResolutionHours !== null
        ? Math.round(avgResolutionHours * 10) / 10
        : null,
    byStatus: statusMap,
  };
}

const CATEGORY_COLORS = [
  "#c7a262",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
];

export async function getSuggestionCategoryBreakdown(filters: ReportFilters) {
  await connectDB();

  const match = buildMatchStage(filters);

  const results = await Suggestion.aggregate([
    { $match: match },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    {
      $lookup: {
        from: SuggestionCategory.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "cat",
      },
    },
    { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ["$cat.name", "Uncategorized"] },
        value: "$count",
      },
    },
    { $sort: { value: -1 } },
  ]);

  return results.map(
    (item: { name: string; value: number }, index: number) => ({
      name: item.name,
      value: item.value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }),
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  reviewed: "#8b5cf6",
  in_progress: "#f59e0b",
  resolved: "#10b981",
  archived: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  in_progress: "In Progress",
  resolved: "Resolved",
  archived: "Archived",
};

export async function getSuggestionStatusBreakdown(filters: ReportFilters) {
  await connectDB();

  const match = buildMatchStage(filters);

  const results = await Suggestion.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return results.map((item: { _id: string; count: number }) => ({
    status: item._id,
    label: STATUS_LABELS[item._id] ?? item._id,
    value: item.count,
    color: STATUS_COLORS[item._id] ?? "#6b7280",
  }));
}

export async function getSuggestionTimeline(filters: ReportFilters) {
  await connectDB();

  const match = buildMatchStage(filters);

  const results = await Suggestion.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Build a map from the results
  const countMap = new Map<string, number>();
  for (const r of results) {
    countMap.set(r._id, r.count);
  }

  // Fill in missing days with 0
  const timeline: { day: string; count: number }[] = [];
  const current = new Date(filters.startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(filters.endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    timeline.push({
      day: dateStr,
      count: countMap.get(dateStr) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return timeline;
}

export async function getSuggestionsForExport(filters: ReportFilters) {
  await connectDB();

  const query: Record<string, unknown> = {
    createdAt: { $gte: filters.startDate, $lte: filters.endDate },
  };
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;

  const suggestions = await Suggestion.find(query)
    .populate("category", "name")
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return suggestions.map((s) => ({
    date: s.createdAt.toISOString().split("T")[0],
    category: (s.category as unknown as { name: string })?.name ?? "N/A",
    status: STATUS_LABELS[s.status] ?? s.status,
    content: s.content,
    adminNotes: s.adminNotes ?? "",
    reviewedBy:
      (s.reviewedBy as unknown as { name: string })?.name ?? "",
    reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString().split("T")[0] : "",
  }));
}
