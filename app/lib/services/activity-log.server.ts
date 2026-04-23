/**
 * Activity Log Service
 * Task: 1.1.2.4.8
 */

import { ActivityLog, type IActivityLog } from "~/lib/db/models/activity-log.server";
import { AdminUser } from "~/lib/db/models/admin-user.server";
import { connectDB } from "~/lib/db/connection.server";

interface DeviceInfo {
  browser: string;
  os: string;
  type: "desktop" | "mobile" | "tablet" | "unknown";
}

/**
 * Parse a user-agent string into readable device info
 */
function parseUserAgent(ua: string): DeviceInfo {
  const result: DeviceInfo = { browser: "Unknown", os: "Unknown", type: "unknown" };

  // Detect OS
  if (/Windows NT 10/.test(ua)) result.os = "Windows 10";
  else if (/Windows NT 11|Windows NT 10.*Win64/.test(ua) && /rv:.*Gecko/.test(ua)) result.os = "Windows 11";
  else if (/Windows/.test(ua)) result.os = "Windows";
  else if (/iPhone/.test(ua)) result.os = "iOS";
  else if (/iPad/.test(ua)) result.os = "iPadOS";
  else if (/Macintosh/.test(ua)) result.os = "macOS";
  else if (/Android/.test(ua)) result.os = "Android";
  else if (/Linux/.test(ua)) result.os = "Linux";
  else if (/CrOS/.test(ua)) result.os = "ChromeOS";

  // Detect browser (order matters — check specific before generic)
  if (/Edg\//.test(ua)) result.browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) result.browser = "Opera";
  else if (/SamsungBrowser/.test(ua)) result.browser = "Samsung Internet";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) result.browser = "Chrome";
  else if (/Firefox\//.test(ua)) result.browser = "Firefox";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) result.browser = "Safari";
  else if (/MSIE|Trident/.test(ua)) result.browser = "Internet Explorer";

  // Detect device type
  if (/Mobile|Android.*Mobile|iPhone/.test(ua)) result.type = "mobile";
  else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) result.type = "tablet";
  else if (/Windows|Macintosh|Linux|CrOS/.test(ua)) result.type = "desktop";

  return result;
}

/**
 * Extract IP address from request headers
 */
function extractIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") || // Cloudflare
    "unknown"
  );
}

interface LogActivityParams {
  userId?: string;
  userName?: string;
  action: IActivityLog["action"];
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  request?: Request;
}

/**
 * Log an activity
 */
export async function logActivity({
  userId,
  userName: providedUserName,
  action,
  resource,
  resourceId,
  details,
  request,
}: LogActivityParams): Promise<void> {
  try {
    await connectDB();

    let userName = providedUserName;
    if (!userName && userId) {
      const user = await AdminUser.findById(userId).select("name").lean();
      userName = user?.name;
    }

    // Extract IP, User Agent, and device info from request
    let ipAddress: string | undefined;
    let userAgent: string | undefined;
    let device: DeviceInfo | undefined;

    if (request) {
      ipAddress = extractIP(request);
      userAgent = request.headers.get("user-agent") || undefined;
      if (userAgent) {
        device = parseUserAgent(userAgent);
      }
    }

    await ActivityLog.create({
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      device,
    });
  } catch (error) {
    // Don't throw - logging should not break the main operation
    console.error("Failed to log activity:", error);
  }
}

/**
 * Get activity logs with filtering and pagination
 */
export async function getActivityLogs({
  userId,
  resource,
  action,
  page = 1,
  limit = 50,
}: {
  userId?: string;
  resource?: string;
  action?: string;
  page?: number;
  limit?: number;
} = {}) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (userId) query.userId = userId;
  if (resource) query.resource = resource;
  if (action) query.action = action;

  const totalCount = await ActivityLog.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);

  const logs = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    logs: logs.map((log) => ({
      id: log._id.toString(),
      userId: log.userId?.toString(),
      userName: log.userName,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      device: log.device || null,
      createdAt: log.createdAt.toISOString(),
    })),
    pagination: {
      page,
      totalPages,
      totalCount,
    },
  };
}

/**
 * Get activity stats for dashboard
 */
export async function getActivityStats() {
  await connectDB();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayCount, weekCount, totalCount, recentLogins] = await Promise.all([
    ActivityLog.countDocuments({ createdAt: { $gte: today } }),
    ActivityLog.countDocuments({ createdAt: { $gte: thisWeek } }),
    ActivityLog.countDocuments(),
    ActivityLog.find({ action: "login" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    todayCount,
    weekCount,
    totalCount,
    recentLogins: recentLogins.map((log) => ({
      userName: log.userName,
      createdAt: log.createdAt.toISOString(),
      ipAddress: log.ipAddress,
      device: log.device || null,
    })),
  };
}
