import type { SerializedToolboxTalk } from "~/lib/services/toolbox-talk.server";

/**
 * Admin Toolbox Talks Listing Page
 * Task: 1.2.1.4.1, 1.2.1.4.6 (Calendar view)
 */

import { useState } from "react";
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
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Image,
  ButtonGroup,
} from "@heroui/react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  PlayCircle,
  Volume2,
  List,
  LayoutGrid,
} from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link } from "react-router";



import { ToolboxTalkCalendar } from "~/components/admin";

const ITEMS_PER_PAGE = 10;

interface LoaderData {
  talks: SerializedToolboxTalk[];
  allTalks: SerializedToolboxTalk[]; // For calendar view
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    thisMonth: number;
    totalViews: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
  };
  currentStatus: string;
  searchQuery: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getToolboxTalks, getToolboxTalkStats, deleteToolboxTalk, toggleToolboxTalkStatus, archiveToolboxTalk, serializeToolboxTalk } = await import("~/lib/services/toolbox-talk.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";

  // Use service to get talks for table view
  const { talks, total, totalPages } = await getToolboxTalks({
    status: status !== "all" ? (status as "draft" | "published" | "archived") : undefined,
    includeAll: status === "all",
    search: search || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  // Task: 1.2.1.4.6 - Get all talks for calendar view (current month + 2 months)
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);

  const { talks: calendarTalks } = await getToolboxTalks({
    includeAll: true,
    startDate,
    endDate,
    limit: 200,
  });

  // Get stats using service
  const stats = await getToolboxTalkStats();

  const data: LoaderData = {
    talks: talks.map(serializeToolboxTalk),
    allTalks: calendarTalks.map(serializeToolboxTalk),
    stats,
    pagination: { page, totalPages, totalCount: total },
    currentStatus: status,
    searchQuery: search,
  };

  return Response.json(data);
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getToolboxTalks, getToolboxTalkStats, deleteToolboxTalk, toggleToolboxTalkStatus, archiveToolboxTalk, serializeToolboxTalk } = await import("~/lib/services/toolbox-talk.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const talkId = formData.get("talkId") as string;

  // Use service functions for all operations
  if (intent === "delete") {
    const deleted = await deleteToolboxTalk(talkId);
    if (deleted) {
      return Response.json({ success: true, message: "Toolbox talk deleted" });
    }
    return Response.json({ error: "Failed to delete" }, { status: 400 });
  }

  if (intent === "toggle-status") {
    const updated = await toggleToolboxTalkStatus(talkId);
    if (updated) {
      return Response.json({ success: true, message: "Status updated" });
    }
    return Response.json({ error: "Failed to update status" }, { status: 400 });
  }

  if (intent === "archive") {
    const archived = await archiveToolboxTalk(talkId);
    if (archived) {
      return Response.json({ success: true, message: "Talk archived" });
    }
    return Response.json({ error: "Failed to archive" }, { status: 400 });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminToolboxTalksPage() {
  const { talks, allTalks, stats, pagination, currentStatus, searchQuery } =
    useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Task: 1.2.1.4.6 - View mode state (table or calendar)
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const formatWeek = (talk: SerializedToolboxTalk) => {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (talk.week && talk.month && talk.year) {
      return `Week ${talk.week}, ${monthNames[talk.month]} ${talk.year}`;
    }
    // Fallback to date format for legacy data
    if (!talk.scheduledDate) return "-";
    return new Date(talk.scheduledDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusColors: Record<string, "success" | "warning" | "default"> = {
    published: "success",
    draft: "warning",
    archived: "default",
  };

  const getMediaIcon = (talk: SerializedToolboxTalk) => {
    if (talk.featuredMedia?.type === "video" || talk.media?.some((m) => m.type === "video")) {
      return <PlayCircle size={14} className="text-gray-400" />;
    }
    if (talk.featuredMedia?.type === "audio" || talk.media?.some((m) => m.type === "audio")) {
      return <Volume2 size={14} className="text-gray-400" />;
    }
    return null;
  };

  const submitForm = (intent: string, talkId: string) => {
    const form = document.createElement("form");
    form.method = "post";
    form.innerHTML = `
      <input type="hidden" name="intent" value="${intent}" />
      <input type="hidden" name="talkId" value="${talkId}" />
    `;
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toolbox Talks</h1>
          <p className="text-sm text-gray-500">Manage weekly safety toolbox talks</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Task: 1.2.1.4.6 - View mode toggle */}
          <ButtonGroup size="sm" variant="flat">
            <Button
              color={viewMode === "table" ? "primary" : "default"}
              onPress={() => setViewMode("table")}
              startContent={<List size={16} />}
            >
              Table
            </Button>
            <Button
              color={viewMode === "calendar" ? "primary" : "default"}
              onPress={() => setViewMode("calendar")}
              startContent={<LayoutGrid size={16} />}
            >
              Calendar
            </Button>
          </ButtonGroup>
          <Button
            as={Link}
            to="/admin/toolbox-talks/new"
            color="primary"
            startContent={<Plus size={18} />}
          >
            Add Talk
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "all" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("all")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Talks</p>
          </CardBody>
        </Card>
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "published" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("published")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-gray-500">Published</p>
          </CardBody>
        </Card>
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "draft" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("draft")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            <p className="text-sm text-gray-500">Drafts</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-primary-600">{stats.thisMonth}</p>
            <p className="text-sm text-gray-500">This Month</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
            <p className="text-sm text-gray-500">Total Views</p>
          </CardBody>
        </Card>
      </div>

      {/* Task: 1.2.1.4.6 - Calendar View */}
      {viewMode === "calendar" && (
        <ToolboxTalkCalendar talks={allTalks} />
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">All Talks</h2>
              <Input
                placeholder="Search talks..."
                defaultValue={searchQuery}
                onValueChange={handleSearch}
                startContent={<Search size={18} className="text-gray-400" />}
                className="max-w-xs"
              />
            </CardHeader>
            <CardBody className="p-0">
              <Table aria-label="Toolbox talks table" removeWrapper>
                <TableHeader>
                  <TableColumn>TALK</TableColumn>
                  <TableColumn>SCHEDULED WEEK</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>VIEWS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No toolbox talks found">
                  {talks.map((talk) => (
                    <TableRow key={talk.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 overflow-hidden rounded bg-gray-100">
                            {talk.featuredMedia ? (
                              <>
                                <Image
                                  src={
                                    talk.featuredMedia.thumbnail ||
                                    talk.featuredMedia.url ||
                                    "https://via.placeholder.com/80x60?text=Talk"
                                  }
                                  alt={talk.title}
                                  className="h-full w-full object-cover"
                                />
                                {talk.featuredMedia.type !== "image" && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    {talk.featuredMedia.type === "video" ? (
                                      <PlayCircle size={16} className="text-white" />
                                    ) : (
                                      <Volume2 size={16} className="text-white" />
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                                <Calendar size={16} className="text-amber-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">
                              {talk.title}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              By {talk.author?.name || "Unknown"}
                            </p>
                          </div>
                          {getMediaIcon(talk)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm">{formatWeek(talk)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color={statusColors[talk.status]} variant="flat">
                          {talk.status}
                        </Chip>
                      </TableCell>
                      <TableCell>{talk.views}</TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly variant="light" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Actions">
                            <DropdownItem
                              key="view"
                              startContent={<Eye size={16} />}
                              href={`/toolbox-talk/${talk.slug}`}
                              target="_blank"
                            >
                              View
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={<Edit size={16} />}
                              href={`/admin/toolbox-talks/${talk.id}/edit`}
                            >
                              Edit
                            </DropdownItem>
                            <DropdownItem
                              key="toggle-status"
                              startContent={<Eye size={16} />}
                              onPress={() => submitForm("toggle-status", talk.id)}
                            >
                              {talk.status === "published" ? "Unpublish" : "Publish"}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              color="danger"
                              startContent={<Trash2 size={16} />}
                              onPress={() => {
                                if (confirm("Are you sure you want to delete this talk?")) {
                                  submitForm("delete", talk.id);
                                }
                              }}
                            >
                              Delete
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
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
        </>
      )}
    </div>
  );
}
