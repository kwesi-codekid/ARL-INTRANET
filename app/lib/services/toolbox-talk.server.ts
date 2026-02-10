/**
 * PSI Talk Service
 * Task: 1.2.1.1.2-7 (Backend Development)
 */

import { ToolboxTalk, type IToolboxTalk, type IMediaItem } from "~/lib/db/models/toolbox-talk.server";

// ============================================
// Input Types
// ============================================

export interface ToolboxTalkInput {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  author: string;
  media?: IMediaItem[];
  featuredMedia?: IMediaItem;
  scheduledDate: Date;
  week?: number;
  month?: number;
  year?: number;
  status?: "draft" | "published" | "archived";
  tags?: string[];
}

// ============================================
// CRUD Operations
// ============================================

export async function createToolboxTalk(data: ToolboxTalkInput): Promise<IToolboxTalk> {
  const talk = new ToolboxTalk(data);
  await talk.save();
  return talk.populate("author");
}

export async function updateToolboxTalk(
  id: string,
  data: Partial<ToolboxTalkInput>
): Promise<IToolboxTalk | null> {
  const talk = await ToolboxTalk.findByIdAndUpdate(id, data, { new: true });
  return talk?.populate("author") || null;
}

export async function deleteToolboxTalk(id: string): Promise<boolean> {
  const result = await ToolboxTalk.findByIdAndDelete(id);
  return !!result;
}

export async function getToolboxTalkById(id: string): Promise<IToolboxTalk | null> {
  return ToolboxTalk.findById(id).populate("author");
}

export async function getToolboxTalkBySlug(slug: string): Promise<IToolboxTalk | null> {
  return ToolboxTalk.findOne({ slug: slug.toLowerCase() }).populate("author");
}

// ============================================
// Task: 1.2.1.1.3 - GET /api/toolbox-talks/today endpoint
// ============================================

export async function getTodaysToolboxTalk(): Promise<IToolboxTalk | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find a published talk scheduled for today
  return ToolboxTalk.findOne({
    status: "published",
    scheduledDate: {
      $gte: today,
      $lt: tomorrow,
    },
  }).populate("author");
}

// ============================================
// Weekly PSI Talk - Get talk for current week
// ============================================

export async function getThisWeeksToolboxTalk(): Promise<IToolboxTalk | null> {
  const today = new Date();
  const currentWeek = getWeekOfMonth(today);
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // First try to find by week/month/year fields
  let talk = await ToolboxTalk.findOne({
    status: "published",
    week: currentWeek,
    month: currentMonth,
    year: currentYear,
  }).populate("author");

  // Fallback to date-based query for legacy data
  if (!talk) {
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    talk = await ToolboxTalk.findOne({
      status: "published",
      scheduledDate: {
        $gte: weekStart,
        $lt: weekEnd,
      },
    })
      .sort({ scheduledDate: -1 })
      .populate("author");
  }

  return talk;
}

// Get current week info
export function getCurrentWeekInfo(): { week: number; month: number; year: number; monthName: string } {
  const today = new Date();
  const week = getWeekOfMonth(today);
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const monthName = today.toLocaleDateString("en-GB", { month: "long" });
  return { week, month, year, monthName };
}

// Get week date range info
export function getWeekDateRange(): { start: Date; end: Date; weekNumber: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get start of week (Monday)
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysToMonday);

  // Get end of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Calculate week number
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

  return { start: weekStart, end: weekEnd, weekNumber };
}

// ============================================
// Task: 1.2.1.1.2 - GET /api/toolbox-talks endpoint (with date filter)
// ============================================

export interface GetToolboxTalksOptions {
  status?: "draft" | "published" | "archived";
  includeAll?: boolean;
  startDate?: Date;
  endDate?: Date;
  // Week-based filtering
  week?: number;
  month?: number;
  year?: number;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedToolboxTalks {
  talks: IToolboxTalk[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getToolboxTalks(options: GetToolboxTalksOptions = {}): Promise<PaginatedToolboxTalks> {
  const filter: Record<string, unknown> = {};
  const page = options.page || 1;
  const limit = options.limit || 20;

  // Status filter
  if (!options.includeAll) {
    filter.status = options.status || "published";
  } else if (options.status) {
    filter.status = options.status;
  }

  // Week/month/year filter (new week-based filtering)
  if (options.year) {
    filter.year = options.year;
  }
  if (options.month) {
    filter.month = options.month;
  }
  if (options.week) {
    filter.week = options.week;
  }

  // Date range filter (fallback for legacy data)
  if (options.startDate || options.endDate) {
    filter.scheduledDate = {};
    if (options.startDate) {
      (filter.scheduledDate as Record<string, Date>).$gte = options.startDate;
    }
    if (options.endDate) {
      (filter.scheduledDate as Record<string, Date>).$lte = options.endDate;
    }
  }

  // Tags filter
  if (options.tags && options.tags.length > 0) {
    filter.tags = { $in: options.tags };
  }

  // Search filter
  if (options.search) {
    filter.$or = [
      { title: { $regex: options.search, $options: "i" } },
      { content: { $regex: options.search, $options: "i" } },
      { summary: { $regex: options.search, $options: "i" } },
    ];
  }

  const [talks, total] = await Promise.all([
    ToolboxTalk.find(filter)
      .populate("author")
      .sort({ year: -1, month: -1, week: -1, scheduledDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ToolboxTalk.countDocuments(filter),
  ]);

  return {
    talks,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// Task: 1.2.1.1.7 - Create PSI talk archive functionality
// ============================================

export async function getToolboxTalkArchive(options: {
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}): Promise<PaginatedToolboxTalks> {
  const { year, month, page = 1, limit = 20 } = options;

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (year) {
    startDate = new Date(year, month !== undefined ? month - 1 : 0, 1);
    endDate = month !== undefined
      ? new Date(year, month, 0, 23, 59, 59) // Last day of the month
      : new Date(year, 11, 31, 23, 59, 59); // Last day of the year
  }

  return getToolboxTalks({
    status: "published",
    startDate,
    endDate,
    page,
    limit,
  });
}

// Get archive months with counts (for calendar/navigation)
export async function getArchiveMonths(): Promise<Array<{
  year: number;
  month: number;
  count: number;
}>> {
  const result = await ToolboxTalk.aggregate([
    { $match: { status: "published" } },
    {
      $group: {
        _id: {
          year: { $ifNull: ["$year", { $year: "$scheduledDate" }] },
          month: { $ifNull: ["$month", { $month: "$scheduledDate" }] },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        count: 1,
      },
    },
  ]);

  return result;
}

// Get archive by weeks within a month
export async function getArchiveWeeks(year: number, month: number): Promise<Array<{
  week: number;
  count: number;
}>> {
  const result = await ToolboxTalk.aggregate([
    {
      $match: {
        status: "published",
        $or: [
          { year, month },
          {
            year: { $exists: false },
            scheduledDate: {
              $gte: new Date(year, month - 1, 1),
              $lt: new Date(year, month, 1),
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: {
          week: { $ifNull: ["$week", { $ceil: { $divide: [{ $dayOfMonth: "$scheduledDate" }, 7] } }] },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.week": 1 } },
    {
      $project: {
        _id: 0,
        week: "$_id.week",
        count: 1,
      },
    },
  ]);

  return result;
}

// ============================================
// Task: 1.2.1.1.6 - Implement PSI talk scheduling
// ============================================

export async function scheduleToolboxTalk(
  id: string,
  scheduledDate: Date
): Promise<IToolboxTalk | null> {
  return ToolboxTalk.findByIdAndUpdate(
    id,
    { scheduledDate, status: "published" },
    { new: true }
  ).populate("author");
}

// Get upcoming scheduled talks
export async function getUpcomingToolboxTalks(limit = 7): Promise<IToolboxTalk[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return ToolboxTalk.find({
    status: "published",
    scheduledDate: { $gte: today },
  })
    .populate("author")
    .sort({ scheduledDate: 1 })
    .limit(limit);
}

// Get past talks
export async function getPastToolboxTalks(limit = 10): Promise<IToolboxTalk[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return ToolboxTalk.find({
    status: "published",
    scheduledDate: { $lt: today },
  })
    .populate("author")
    .sort({ scheduledDate: -1 })
    .limit(limit);
}

// ============================================
// Utilities
// ============================================

export async function incrementViews(id: string): Promise<void> {
  await ToolboxTalk.findByIdAndUpdate(id, { $inc: { views: 1 } });
}

export async function getToolboxTalkStats(): Promise<{
  total: number;
  published: number;
  draft: number;
  archived: number;
  thisMonth: number;
  totalViews: number;
}> {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const [total, published, draft, archived, thisMonthCount, viewsResult] = await Promise.all([
    ToolboxTalk.countDocuments(),
    ToolboxTalk.countDocuments({ status: "published" }),
    ToolboxTalk.countDocuments({ status: "draft" }),
    ToolboxTalk.countDocuments({ status: "archived" }),
    ToolboxTalk.countDocuments({
      status: "published",
      scheduledDate: { $gte: thisMonth },
    }),
    ToolboxTalk.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]),
  ]);

  return {
    total,
    published,
    draft,
    archived,
    thisMonth: thisMonthCount,
    totalViews: viewsResult[0]?.totalViews || 0,
  };
}

// Generate unique slug
export async function generateUniqueSlug(title: string): Promise<string> {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check if slug exists
  let counter = 0;
  let uniqueSlug = slug;

  while (await ToolboxTalk.findOne({ slug: uniqueSlug })) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }

  return uniqueSlug;
}

// Get talks by date range (for calendar views)
export async function getToolboxTalksByDateRange(
  startDate: Date,
  endDate: Date
): Promise<IToolboxTalk[]> {
  return ToolboxTalk.find({
    status: "published",
    scheduledDate: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .populate("author")
    .sort({ scheduledDate: 1 });
}

// Check if a talk exists for a specific date
export async function hasToolboxTalkForDate(date: Date): Promise<boolean> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const count = await ToolboxTalk.countDocuments({
    status: "published",
    scheduledDate: {
      $gte: dayStart,
      $lt: dayEnd,
    },
  });

  return count > 0;
}

// ============================================
// Navigation - Get Adjacent Talks
// ============================================

export interface AdjacentTalk {
  slug: string;
  title: string;
}

export interface AdjacentTalks {
  prev: AdjacentTalk | null;
  next: AdjacentTalk | null;
}

export async function getAdjacentToolboxTalks(scheduledDate: Date): Promise<AdjacentTalks> {
  const [prevTalk, nextTalk] = await Promise.all([
    ToolboxTalk.findOne({
      status: "published",
      scheduledDate: { $lt: scheduledDate },
    })
      .sort({ scheduledDate: -1 })
      .select("slug title")
      .lean(),
    ToolboxTalk.findOne({
      status: "published",
      scheduledDate: { $gt: scheduledDate },
    })
      .sort({ scheduledDate: 1 })
      .select("slug title")
      .lean(),
  ]);

  return {
    prev: prevTalk ? { slug: prevTalk.slug, title: prevTalk.title } : null,
    next: nextTalk ? { slug: nextTalk.slug, title: nextTalk.title } : null,
  };
}

// ============================================
// Admin - Toggle Status
// ============================================

export async function toggleToolboxTalkStatus(id: string): Promise<IToolboxTalk | null> {
  const talk = await ToolboxTalk.findById(id);
  if (!talk) return null;

  talk.status = talk.status === "published" ? "draft" : "published";
  await talk.save();
  return talk;
}

export async function archiveToolboxTalk(id: string): Promise<IToolboxTalk | null> {
  return ToolboxTalk.findByIdAndUpdate(
    id,
    { status: "archived" },
    { new: true }
  );
}

// ============================================
// Serialization Helpers (for JSON responses)
// ============================================

export interface SerializedToolboxTalk {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  featuredMedia: IMediaItem | null;
  media: IMediaItem[];
  scheduledDate: string;
  week: number;
  month: number;
  year: number;
  status: string;
  tags: string[];
  views: number;
  author: { name: string } | null;
  createdAt?: string;
}

export function serializeToolboxTalk(talk: IToolboxTalk): SerializedToolboxTalk {
  // Compute week/month/year from scheduledDate if not set
  const schedDate = new Date(talk.scheduledDate);
  const week = talk.week || getWeekOfMonth(schedDate);
  const month = talk.month || (schedDate.getMonth() + 1);
  const year = talk.year || schedDate.getFullYear();

  return {
    id: talk._id.toString(),
    title: talk.title,
    slug: talk.slug,
    content: talk.content,
    summary: talk.summary || talk.content.substring(0, 150) + "...",
    featuredMedia: talk.featuredMedia || null,
    media: talk.media || [],
    scheduledDate: talk.scheduledDate.toISOString(),
    week,
    month,
    year,
    status: talk.status,
    tags: talk.tags || [],
    views: talk.views,
    author: talk.author
      ? { name: (talk.author as { name?: string }).name || "Unknown" }
      : null,
    createdAt: talk.createdAt?.toISOString(),
  };
}

// Helper to get week of month (1-5)
export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
}

// Helper to get date from week/month/year (returns first day of that week)
export function getDateFromWeek(week: number, month: number, year: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  // Calculate the first day of the specified week
  const dayOffset = (week - 1) * 7 - firstDayOfWeek + 1;
  return new Date(year, month - 1, Math.max(1, dayOffset));
}

// Format week display string
export function formatWeekDisplay(week: number, month: number, year: number): string {
  const monthName = new Date(year, month - 1).toLocaleDateString("en-GB", { month: "long" });
  return `Week ${week} of ${monthName} ${year}`;
}

export function serializeToolboxTalkList(talks: IToolboxTalk[]): SerializedToolboxTalk[] {
  return talks.map(serializeToolboxTalk);
}
