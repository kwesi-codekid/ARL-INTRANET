/**
 * Admin Dashboard
 * Task: 1.1.2.3.2
 */

import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  Newspaper,
  Users,
  AppWindow,
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  Calendar,
  Image,
  HardHat,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";











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

  const user = await requireAuth(request);
  await connectDB();

  // Fetch live stats from database
  const [
    newsCount,
    contactsCount,
    appsCount,
    activeAlertsCount,
    eventsCount,
    albumsCount,
    toolboxTalksCount,
    recentActivityLogs,
  ] = await Promise.all([
    News.countDocuments({ status: "published" }),
    Contact.countDocuments({ isActive: true }),
    AppLink.countDocuments({ isActive: true }),
    Alert.countDocuments({ isActive: true }),
    Event.countDocuments({ status: "published" }),
    Album.countDocuments({ status: "published" }),
    ToolboxTalk.countDocuments({ status: "published" }),
    ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const stats = {
    news: newsCount,
    contacts: contactsCount,
    apps: appsCount,
    safetyAlerts: activeAlertsCount,
    events: eventsCount,
    albums: albumsCount,
    toolboxTalks: toolboxTalksCount,
  };

  // Format recent activity from activity logs
  const recentActivity = recentActivityLogs.map((log) => {
    const actionText = getActionText(log.action, log.resource, log.details);
    const timeAgo = getTimeAgo(log.createdAt);
    const type = getActivityType(log.resource);
    return { action: actionText, time: timeAgo, type };
  });

  return {
    user: {
      name: user.name,
      role: user.role,
    },
    stats,
    recentActivity,
  };
}

function getActionText(action: string, resource: string, details?: Record<string, unknown>): string {
  const resourceName = details?.name || details?.title || resource;
  switch (action) {
    case "create":
      return `New ${resource} created: ${resourceName}`;
    case "update":
      return `${resource} updated: ${resourceName}`;
    case "delete":
      return `${resource} deleted: ${resourceName}`;
    case "login":
      return "Admin logged in";
    case "logout":
      return "Admin logged out";
    default:
      return `${action} on ${resource}`;
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString();
}

function getActivityType(resource: string): string {
  switch (resource) {
    case "news":
      return "news";
    case "contact":
    case "directory":
      return "directory";
    case "alert":
    case "safety":
      return "safety";
    case "applink":
    case "app":
      return "app";
    case "event":
      return "event";
    case "album":
    case "gallery":
      return "gallery";
    default:
      return "other";
  }
}

export default function AdminDashboard() {
  const { user, stats, recentActivity } = useLoaderData<typeof loader>();

  const statCards = [
    {
      label: "News Articles",
      value: stats.news,
      icon: Newspaper,
      color: "bg-blue-500",
      href: "/admin/news",
    },
    {
      label: "Contacts",
      value: stats.contacts.toLocaleString(),
      icon: Users,
      color: "bg-green-500",
      href: "/admin/directory",
    },
    {
      label: "App Links",
      value: stats.apps,
      icon: AppWindow,
      color: "bg-purple-500",
      href: "/admin/apps",
    },
    {
      label: "Active Alerts",
      value: stats.safetyAlerts,
      icon: AlertTriangle,
      color: "bg-orange-500",
      href: "/admin/alerts",
    },
    {
      label: "Events",
      value: stats.events,
      icon: Calendar,
      color: "bg-teal-500",
      href: "/admin/events",
    },
    {
      label: "Photo Albums",
      value: stats.albums,
      icon: Image,
      color: "bg-pink-500",
      href: "/admin/gallery",
    },
    {
      label: "Toolbox Talks",
      value: stats.toolboxTalks,
      icon: HardHat,
      color: "bg-amber-500",
      href: "/admin/toolbox-talks",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary-500 to-primary-600">
        <CardBody className="py-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user.name}!
          </h1>
          <p className="mt-1 text-white/80">
            Here's what's happening with ARL Connect today.
          </p>
        </CardBody>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardBody className="flex flex-row items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      activity.type === "news"
                        ? "bg-blue-500"
                        : activity.type === "directory"
                          ? "bg-green-500"
                          : activity.type === "safety"
                            ? "bg-orange-500"
                            : "bg-purple-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h2>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/admin/news/new"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Newspaper size={24} className="text-primary-500" />
                <span className="text-sm font-medium text-gray-700">
                  Add News
                </span>
              </Link>
              <Link
                to="/admin/events/new"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Calendar size={24} className="text-primary-500" />
                <span className="text-sm font-medium text-gray-700">
                  Add Event
                </span>
              </Link>
              <Link
                to="/admin/gallery/new"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Image size={24} className="text-primary-500" />
                <span className="text-sm font-medium text-gray-700">
                  Add Album
                </span>
              </Link>
              <Link
                to="/admin/alerts/new"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <Shield size={24} className="text-primary-500" />
                <span className="text-sm font-medium text-gray-700">
                  Add Alert
                </span>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
