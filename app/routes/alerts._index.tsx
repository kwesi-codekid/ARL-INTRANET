/**
 * Public Alerts Page
 * Task: 1.2.3.3.1 - Create alerts listing page
 * Task: 1.2.3.3.2 - Build alert card component with severity indicator
 * Task: 1.2.3.3.3 - Implement active/history tabs
 * Task: 1.2.3.3.5 - Add date range filter for history
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Tabs,
  Tab,
  Pagination,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { AlertTriangle, AlertCircle, Info, Bell, Calendar, Filter } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useSearchParams } from "react-router";
import { MainLayout } from "~/components/layout";
import type { SerializedAlert, AlertSeverity } from "~/lib/services/alert.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { getAlerts, getAlertHistory, serializeAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "active";
  const severity = url.searchParams.get("severity") as AlertSeverity | null;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  let result;
  if (tab === "history") {
    result = await getAlertHistory({
      severity: severity || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit: 12,
    });
  } else {
    result = await getAlerts({
      severity: severity || undefined,
      page,
      limit: 12,
    });
  }

  return Response.json({
    alerts: result.alerts.map(serializeAlert),
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    tab,
    severity: severity || "",
    startDate: startDate || "",
    endDate: endDate || "",
  });
}

interface LoaderData {
  alerts: SerializedAlert[];
  total: number;
  page: number;
  totalPages: number;
  tab: string;
  severity: string;
  startDate: string;
  endDate: string;
}

const severityConfig = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    chipColor: "danger" as const,
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    chipColor: "warning" as const,
    icon: AlertCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    chipColor: "primary" as const,
    icon: Info,
  },
};

const typeLabels: Record<string, string> = {
  safety: "Safety",
  incident: "Incident",
  general: "General",
  maintenance: "Maintenance",
  weather: "Weather",
};

function AlertCard({ alert }: { alert: SerializedAlert }) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <Card
      as={Link}
      to={`/alerts/${alert.id}`}
      className={`${config.bg} ${config.border} border shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      isPressable
    >
      <CardBody className="flex flex-row gap-4">
        <div className={`flex-shrink-0 p-3 rounded-full ${config.iconBg}`}>
          <Icon size={24} className={config.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Chip size="sm" color={config.chipColor} variant="flat">
              {alert.severity.toUpperCase()}
            </Chip>
            <Chip size="sm" variant="flat">
              {typeLabels[alert.type] || alert.type}
            </Chip>
            {alert.isPinned && (
              <Chip size="sm" color="secondary" variant="flat">
                Pinned
              </Chip>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{alert.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{alert.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(alert.createdAt).toLocaleDateString()} at{" "}
            {new Date(alert.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function AlertsPage() {
  const { alerts, total, page, totalPages, tab, severity, startDate, endDate } =
    useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams();
    params.set("tab", newTab);
    if (severity) params.set("severity", severity);
    setSearchParams(params);
  };

  const handleSeverityChange = (newSeverity: string) => {
    const params = new URLSearchParams(searchParams);
    if (newSeverity) {
      params.set("severity", newSeverity);
    } else {
      params.delete("severity");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleDateFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (localStartDate) {
      params.set("startDate", localStartDate);
    } else {
      params.delete("startDate");
    }
    if (localEndDate) {
      params.set("endDate", localEndDate);
    } else {
      params.delete("endDate");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Bell size={24} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety & Incident Alerts</h1>
            <p className="text-gray-500">Stay informed about important safety notices</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => handleTabChange(key.toString())}
        variant="underlined"
        color="danger"
        className="mb-6"
      >
        <Tab key="active" title="Active Alerts" />
        <Tab key="history" title="Alert History" />
      </Tabs>

      {/* Filters */}
      <Card className="mb-6 shadow-sm">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Select
            label="Severity"
            placeholder="All severities"
            selectedKeys={severity ? [severity] : []}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="w-full sm:w-40"
          >
            <SelectItem key="">All</SelectItem>
            <SelectItem key="critical">Critical</SelectItem>
            <SelectItem key="warning">Warning</SelectItem>
            <SelectItem key="info">Info</SelectItem>
          </Select>

          {tab === "history" && (
            <>
              <Input
                type="date"
                label="From"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="w-full sm:w-40"
              />
              <Input
                type="date"
                label="To"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="w-full sm:w-40"
              />
              <Button
                color="primary"
                variant="flat"
                startContent={<Filter size={16} />}
                onPress={handleDateFilter}
              >
                Apply
              </Button>
            </>
          )}

          <div className="flex-1 text-right text-sm text-gray-500">
            {total} alert{total !== 1 ? "s" : ""} found
          </div>
        </CardBody>
      </Card>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="py-12 text-center">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">
              {tab === "active" ? "No active alerts" : "No alerts found"}
            </h3>
            <p className="text-gray-500">
              {tab === "active"
                ? "There are currently no active safety alerts."
                : "Try adjusting your filters."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={(newPage) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", newPage.toString());
              setSearchParams(params);
            }}
            color="danger"
          />
        </div>
      )}
    </MainLayout>
  );
}
