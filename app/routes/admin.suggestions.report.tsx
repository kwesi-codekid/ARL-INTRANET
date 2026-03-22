/**
 * Admin Suggestions Report Page
 * Analytics dashboard for suggestion box data
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Select,
  SelectItem,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  ArrowLeft,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Clock,
  Star,
  MessageSquare,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link } from "react-router";
import {
  SuggestionCategoryChart,
  SuggestionStatusChart,
  SuggestionTrendChart,
} from "~/components/admin/charts";

interface ReportStats {
  total: number;
  avgPerDay: number;
  peakDay: { date: string; count: number } | null;
  avgResolutionHours: number | null;
}

interface CategoryItem {
  name: string;
  value: number;
  color: string;
}

interface StatusItem {
  status: string;
  label: string;
  value: number;
  color: string;
}

interface TimelineItem {
  day: string;
  count: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface LoaderData {
  stats: ReportStats;
  categoryBreakdown: CategoryItem[];
  statusBreakdown: StatusItem[];
  timeline: TimelineItem[];
  categories: CategoryOption[];
  range: string;
  startDate: string;
  endDate: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getAllCategories } = await import(
    "~/lib/services/suggestion.server"
  );
  const {
    getSuggestionReportStats,
    getSuggestionCategoryBreakdown,
    getSuggestionStatusBreakdown,
    getSuggestionTimeline,
  } = await import("~/lib/services/suggestion-report.server");

  await requireAuth(request);

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "30";
  const categoryFilter = url.searchParams.get("category") || undefined;
  const statusFilter = url.searchParams.get("status") || undefined;

  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (range === "custom") {
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");
    startDate = startParam
      ? new Date(startParam)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = endParam ? new Date(endParam) : now;
  } else {
    const days = parseInt(range) || 30;
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const filters = {
    startDate,
    endDate,
    category: categoryFilter,
    status: statusFilter,
  };

  const [stats, categoryBreakdown, statusBreakdown, timeline, categories] =
    await Promise.all([
      getSuggestionReportStats(filters),
      getSuggestionCategoryBreakdown(filters),
      getSuggestionStatusBreakdown(filters),
      getSuggestionTimeline(filters),
      getAllCategories(),
    ]);

  return Response.json({
    stats,
    categoryBreakdown,
    statusBreakdown,
    timeline,
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
    })),
    range,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  });
}

const RANGE_PRESETS = [
  { key: "7", label: "7 Days" },
  { key: "30", label: "30 Days" },
  { key: "90", label: "90 Days" },
  { key: "custom", label: "Custom" },
];

const STATUS_OPTIONS = [
  { key: "", label: "All Statuses" },
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "archived", label: "Archived" },
];

export default function SuggestionsReportPage() {
  const {
    stats,
    categoryBreakdown,
    statusBreakdown,
    timeline,
    categories,
    range,
    startDate,
    endDate,
  } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const currentCategory = searchParams.get("category") || "";
  const currentStatus = searchParams.get("status") || "";

  const handleRangeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", newRange);
    if (newRange !== "custom") {
      params.delete("start");
      params.delete("end");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleCustomDateApply = () => {
    const params = new URLSearchParams(searchParams);
    params.set("range", "custom");
    params.set("start", customStart);
    params.set("end", customEnd);
    setSearchParams(params);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const buildExportUrl = (format: string) => {
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("range", range);
    if (range === "custom") {
      params.set("start", startDate);
      params.set("end", endDate);
    }
    if (currentCategory) params.set("category", currentCategory);
    if (currentStatus) params.set("status", currentStatus);
    return `/api/suggestions/export?${params.toString()}`;
  };

  const formatResolutionTime = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24 * 10) / 10;
    return `${days}d`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/admin/suggestions">
            <Button isIconOnly variant="flat" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Suggestions Report
            </h1>
            <p className="text-sm text-gray-500">
              Analytics and trends for the suggestion box
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            startContent={<Printer size={16} />}
            onPress={() => window.print()}
          >
            Print
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button
                color="primary"
                startContent={<Download size={16} />}
              >
                Export
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Export options">
              <DropdownItem
                key="csv"
                href={buildExportUrl("csv")}
                target="_blank"
              >
                Download CSV
              </DropdownItem>
              <DropdownItem
                key="xlsx"
                href={buildExportUrl("xlsx")}
                target="_blank"
              >
                Download Excel
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Print header - only visible when printing */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-gray-900">
          Suggestions Report
        </h1>
        <p className="text-sm text-gray-500">
          {startDate} to {endDate}
        </p>
      </div>

      {/* Date Range & Filters */}
      <Card className="shadow-sm print:hidden">
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            {/* Range preset chips */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              {RANGE_PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  size="sm"
                  variant={range === preset.key ? "solid" : "flat"}
                  color={range === preset.key ? "primary" : "default"}
                  onPress={() => handleRangeChange(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom date inputs */}
            {range === "custom" && (
              <div className="flex items-end gap-2">
                <Input
                  type="date"
                  label="From"
                  size="sm"
                  value={customStart}
                  onValueChange={setCustomStart}
                  className="w-40"
                />
                <Input
                  type="date"
                  label="To"
                  size="sm"
                  value={customEnd}
                  onValueChange={setCustomEnd}
                  className="w-40"
                />
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleCustomDateApply}
                >
                  Apply
                </Button>
              </div>
            )}

            {/* Category & Status filters */}
            <div className="flex items-end gap-2 ml-auto">
              <Select
                placeholder="Category"
                size="sm"
                className="w-40"
                selectedKeys={currentCategory ? [currentCategory] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  handleFilterChange("category", value || "");
                }}
              >
                {[{ id: "", name: "All Categories" }, ...categories].map(
                  (c) => (
                    <SelectItem key={c.id}>{c.name}</SelectItem>
                  ),
                )}
              </Select>
              <Select
                placeholder="Status"
                size="sm"
                className="w-40"
                selectedKeys={currentStatus ? [currentStatus] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  handleFilterChange("status", value || "");
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.key}>{s.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3 py-4">
            <div className="rounded-lg bg-primary-50 p-2.5">
              <MessageSquare size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Suggestions</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3 py-4">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgPerDay}
              </p>
              <p className="text-xs text-gray-500">Avg / Day</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3 py-4">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Star size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.peakDay ? stats.peakDay.count : "N/A"}
              </p>
              <p className="text-xs text-gray-500">
                Peak Day
                {stats.peakDay && (
                  <span className="block text-[10px]">
                    {new Date(stats.peakDay.date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </span>
                )}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3 py-4">
            <div className="rounded-lg bg-green-50 p-2.5">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatResolutionTime(stats.avgResolutionHours)}
              </p>
              <p className="text-xs text-gray-500">Avg Resolution</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row - Category + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SuggestionCategoryChart data={categoryBreakdown} />
        <SuggestionStatusChart data={statusBreakdown} />
      </div>

      {/* Timeline Chart - Full Width */}
      <SuggestionTrendChart data={timeline} />

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
