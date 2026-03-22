/**
 * Admin Dashboard
 * Task: 1.1.2.3.2
 */

import { Card, CardBody, CardHeader, Chip, Button } from "@heroui/react";
import {
  Newspaper,
  Users,
  AlertTriangle,
  Calendar,
  HardHat,
  Zap,
  Shield,
  Video,
  Lightbulb,
  Plus,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { ContentDistributionChart } from "~/components/admin/charts";
import { ActivityTimelineChart } from "~/components/admin/charts";
import { ContentStatusChart } from "~/components/admin/charts";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");
  const { Contact } = await import("~/lib/db/models/contact.server");
  const { AppLink } = await import("~/lib/db/models/app-link.server");
  const { Alert } = await import("~/lib/db/models/alert.server");
  const { Event } = await import("~/lib/db/models/event.server");
  const { Album } = await import("~/lib/db/models/gallery.server");
  const { ToolboxTalk } = await import("~/lib/db/models/toolbox-talk.server");
  const { ActivityLog } = await import("~/lib/db/models/activity-log.server");
  const { SafetyTip } = await import("~/lib/db/models/safety-tip.server");
  const { SafetyVideo } = await import("~/lib/db/models/safety-video.server");
  const { User } = await import("~/lib/db/models/user.server");

  const user = await requireAuth(request);
  await connectDB();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Helper to safely run a query with a fallback
  const safe = <T,>(promise: Promise<T>, fallback: T): Promise<T> =>
    promise.catch((err) => {
      console.error("[Admin Dashboard] Query failed:", err?.message || err);
      return fallback;
    });

  const [
    newsCount,
    contactsCount,
    appsCount,
    activeAlertsCount,
    eventsCount,
    albumsCount,
    toolboxTalksCount,
    draftNewsCount,
    draftEventsCount,
    portalUsersCount,
    safetyVideosCount,
    safetyTipsCount,
    draftToolboxTalksCount,
    activityTimelineRaw,
  ] = await Promise.all([
    safe(News.countDocuments({ status: "published" }), 0),
    safe(Contact.countDocuments({ isActive: true }), 0),
    safe(AppLink.countDocuments({ isActive: true }), 0),
    safe(Alert.countDocuments({ isActive: true }), 0),
    safe(Event.countDocuments({ status: "published" }), 0),
    safe(Album.countDocuments({ status: "published" }), 0),
    safe(ToolboxTalk.countDocuments({ status: "published" }), 0),
    safe(News.countDocuments({ status: "draft" }), 0),
    safe(Event.countDocuments({ status: "draft" }), 0),
    safe(User.countDocuments(), 0),
    safe(SafetyVideo.countDocuments({ status: "published" }), 0),
    safe(SafetyTip.countDocuments({ status: "published" }), 0),
    safe(ToolboxTalk.countDocuments({ status: "draft" }), 0),
    safe(
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      [] as Array<{ _id: string; count: number }>
    ),
  ]);

  // Fill missing days for activity timeline (always 7 entries)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timelineMap = new Map<string, number>();
  for (const entry of activityTimelineRaw) {
    timelineMap.set(entry._id, entry.count);
  }
  const activityTimeline: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    activityTimeline.push({
      day: dayNames[d.getDay()],
      count: timelineMap.get(key) || 0,
    });
  }

  const stats = {
    news: newsCount,
    contacts: contactsCount,
    apps: appsCount,
    safetyAlerts: activeAlertsCount,
    events: eventsCount,
    albums: albumsCount,
    toolboxTalks: toolboxTalksCount,
    draftNews: draftNewsCount,
    draftEvents: draftEventsCount,
    portalUsers: portalUsersCount,
    safetyVideos: safetyVideosCount,
    safetyTips: safetyTipsCount,
    draftToolboxTalks: draftToolboxTalksCount,
  };

  // Derive content distribution from existing counts (no new DB queries)
  const contentDistribution = [
    { name: "News", value: newsCount, color: "#3b82f6" },
    { name: "Events", value: eventsCount, color: "#10b981" },
    { name: "Albums", value: albumsCount, color: "#8b5cf6" },
    { name: "PSI Talks", value: toolboxTalksCount, color: "#f59e0b" },
    { name: "Safety Videos", value: safetyVideosCount, color: "#ef4444" },
    { name: "Safety Tips", value: safetyTipsCount, color: "#06b6d4" },
    { name: "App Links", value: appsCount, color: "#ec4899" },
  ];

  // Derive content status (published vs draft) from existing counts
  const contentStatus = [
    { name: "News", published: newsCount, draft: draftNewsCount },
    { name: "Events", published: eventsCount, draft: draftEventsCount },
    { name: "PSI Talks", published: toolboxTalksCount, draft: draftToolboxTalksCount },
  ];

  return {
    user: {
      name: user.name,
      role: user.role,
    },
    stats,
    activityTimeline,
    contentDistribution,
    contentStatus,
  };
}

export default function AdminDashboard() {
  const { stats, activityTimeline, contentDistribution, contentStatus } =
    useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your ARL Intranet content and settings
        </p>
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/news" className="group">
          <Card className="border border-blue-100 bg-blue-50 shadow-sm transition-shadow group-hover:shadow-md">
            <CardBody className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">News Articles</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.news}</p>
                  <p className="mt-1 text-xs text-gray-500">Published articles</p>
                </div>
                <div className="rounded-lg bg-blue-100 p-2.5">
                  <Newspaper size={22} className="text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>

        <Link to="/admin/directory" className="group">
          <Card className="border border-amber-100 bg-amber-50 shadow-sm transition-shadow group-hover:shadow-md">
            <CardBody className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Contacts</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.contacts.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-gray-500">Active contacts</p>
                </div>
                <div className="rounded-lg bg-amber-100 p-2.5">
                  <Users size={22} className="text-amber-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>

        <Link to="/admin/alerts" className="group">
          <Card className="border border-orange-100 bg-orange-50 shadow-sm transition-shadow group-hover:shadow-md">
            <CardBody className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Active Alerts</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.safetyAlerts}</p>
                  <p className="mt-1 text-xs text-gray-500">Safety alerts active</p>
                </div>
                <div className="rounded-lg bg-orange-100 p-2.5">
                  <AlertTriangle size={22} className="text-orange-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>

        <Link to="/admin/events" className="group">
          <Card className="border border-green-100 bg-green-50 shadow-sm transition-shadow group-hover:shadow-md">
            <CardBody className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Events</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats.events}</p>
                  <p className="mt-1 text-xs text-gray-500">Published events</p>
                </div>
                <div className="rounded-lg bg-green-100 p-2.5">
                  <Calendar size={22} className="text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Middle Row — Content Distribution + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Distribution Donut Chart */}
        <ContentDistributionChart data={contentDistribution} />

        {/* Activity Timeline Chart */}
        <ActivityTimelineChart data={activityTimeline} />
      </div>

      {/* Bottom Row — Quick Actions, Content Status, Safety Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-[#c7a262]" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <Button
                as={Link}
                to="/admin/news/new"
                variant="bordered"
                className="flex h-auto flex-col gap-2 border-2 border-dashed border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Plus size={18} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add News</span>
              </Button>
              <Button
                as={Link}
                to="/admin/events/new"
                variant="bordered"
                className="flex h-auto flex-col gap-2 border-2 border-dashed border-gray-200 p-4 hover:border-green-300 hover:bg-green-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Plus size={18} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Event</span>
              </Button>
              <Button
                as={Link}
                to="/admin/alerts/new"
                variant="bordered"
                className="flex h-auto flex-col gap-2 border-2 border-dashed border-gray-200 p-4 hover:border-orange-300 hover:bg-orange-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <Plus size={18} className="text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Alert</span>
              </Button>
              <Button
                as={Link}
                to="/admin/gallery/new"
                variant="bordered"
                className="flex h-auto flex-col gap-2 border-2 border-dashed border-gray-200 p-4 hover:border-purple-300 hover:bg-purple-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Plus size={18} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Album</span>
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Content Status Bar Chart */}
        <ContentStatusChart data={contentStatus} />

        {/* Safety Overview */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-[#c7a262]" />
              <h2 className="text-lg font-semibold text-gray-900">Safety Overview</h2>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" />
                  <span className="text-sm text-gray-700">Active Alerts</span>
                </div>
                <Chip size="sm" variant="flat" color="warning">
                  {stats.safetyAlerts}
                </Chip>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <HardHat size={16} className="text-blue-500" />
                  <span className="text-sm text-gray-700">PSI Talks</span>
                </div>
                <Chip size="sm" variant="flat" color="primary">
                  {stats.toolboxTalks}
                </Chip>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-green-500" />
                  <span className="text-sm text-gray-700">Safety Tips</span>
                </div>
                <Chip size="sm" variant="flat" color="success">
                  {stats.safetyTips}
                </Chip>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Video size={16} className="text-purple-500" />
                  <span className="text-sm text-gray-700">Safety Videos</span>
                </div>
                <Chip size="sm" variant="flat" color="secondary">
                  {stats.safetyVideos}
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
