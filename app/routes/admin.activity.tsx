/**
 * Admin Activity Log Viewer
 * Task: 1.1.2.4.9
 */

import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import { Activity, User, FileText, Settings, LogIn, LogOut, Eye, Pencil, Trash2, Plus, ToggleLeft } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";



// Type definitions
interface ActivityLog {
  _id: string;
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface ActivityStats {
  todayCount: number;
  weekCount: number;
  totalCount: number;
  recentLogins: number;
}

interface LoaderData {
  logs: ActivityLog[];
  pagination: { page: number; totalPages: number; total: number };
  stats: ActivityStats;
  filters: { resource?: string; action?: string };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireSuperAdmin } = await import("~/lib/services/session.server");
  const { getActivityLogs, getActivityStats } = await import("~/lib/services/activity-log.server");

  await requireSuperAdmin(request);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const resource = url.searchParams.get("resource") || undefined;
  const action = url.searchParams.get("action") || undefined;

  const [logsData, stats] = await Promise.all([
    getActivityLogs({ page, resource, action, limit: 25 }),
    getActivityStats(),
  ]);

  return Response.json({
    ...logsData,
    stats,
    filters: { resource, action },
  });
}

const actionIcons: Record<string, typeof Activity> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  activate: ToggleLeft,
  deactivate: ToggleLeft,
  login: LogIn,
  logout: LogOut,
  view: Eye,
};

const actionColors: Record<string, "success" | "warning" | "danger" | "primary" | "default"> = {
  create: "success",
  update: "warning",
  delete: "danger",
  activate: "success",
  deactivate: "default",
  login: "primary",
  logout: "default",
  view: "primary",
};

const resourceLabels: Record<string, string> = {
  admin_user: "Admin User",
  news: "News Article",
  news_category: "News Category",
  contact: "Contact",
  department: "Department",
  app_link: "App Link",
  session: "Session",
};

export default function AdminActivityPage() {
  const { logs, pagination, stats, filters } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionDescription = (log: ActivityLog) => {
    const resource = resourceLabels[log.resource] || log.resource;

    switch (log.action) {
      case "create":
        return `Created ${resource}`;
      case "update":
        return `Updated ${resource}`;
      case "delete":
        return `Deleted ${resource}`;
      case "activate":
        return `Activated ${resource}`;
      case "deactivate":
        return `Deactivated ${resource}`;
      case "login":
        return "Logged in";
      case "logout":
        return "Logged out";
      case "view":
        return `Viewed ${resource}`;
      default:
        return `${log.action} ${resource}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-sm text-gray-500">Monitor admin actions and system events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
            <p className="text-sm text-gray-500">Today</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-primary-600">{stats.weekCount}</p>
            <p className="text-sm text-gray-500">This Week</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-gray-600">{stats.totalCount}</p>
            <p className="text-sm text-gray-500">Total Logged</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.recentLogins.length}</p>
            <p className="text-sm text-gray-500">Recent Logins</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-primary-500" />
            <h2 className="text-lg font-semibold">Activity History</h2>
          </div>
          <div className="flex gap-2">
            <Select
              placeholder="All Resources"
              selectedKeys={filters.resource ? [filters.resource] : []}
              onChange={(e) => handleFilterChange("resource", e.target.value)}
              className="w-40"
              size="sm"
            >
              <SelectItem key="all">All Resources</SelectItem>
              <SelectItem key="admin_user">Admin Users</SelectItem>
              <SelectItem key="news">News</SelectItem>
              <SelectItem key="news_category">Categories</SelectItem>
              <SelectItem key="contact">Contacts</SelectItem>
              <SelectItem key="session">Sessions</SelectItem>
            </Select>
            <Select
              placeholder="All Actions"
              selectedKeys={filters.action ? [filters.action] : []}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-36"
              size="sm"
            >
              <SelectItem key="all">All Actions</SelectItem>
              <SelectItem key="create">Create</SelectItem>
              <SelectItem key="update">Update</SelectItem>
              <SelectItem key="delete">Delete</SelectItem>
              <SelectItem key="login">Login</SelectItem>
              <SelectItem key="logout">Logout</SelectItem>
            </Select>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Activity log table" removeWrapper className="min-w-[600px]">
            <TableHeader>
              <TableColumn>ACTION</TableColumn>
              <TableColumn>USER</TableColumn>
              <TableColumn>DETAILS</TableColumn>
              <TableColumn>IP ADDRESS</TableColumn>
              <TableColumn>TIME</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No activity logs found">
              {logs.map((log) => {
                const ActionIcon = actionIcons[log.action] || Activity;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={actionColors[log.action] || "default"}
                          startContent={<ActionIcon size={12} />}
                        >
                          {log.action}
                        </Chip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{log.userName || "System"}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{getActionDescription(log)}</p>
                        {log.details && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {typeof log.details === "object"
                              ? JSON.stringify(log.details).substring(0, 50) + "..."
                              : String(log.details)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{log.ipAddress || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}
    </div>
  );
}
