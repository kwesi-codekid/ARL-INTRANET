/**
 * Admin Events Listing Page
 * Task: 1.3.1.1.4 - Admin events management
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
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Image,
} from "@heroui/react";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Star, Calendar, MapPin } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link } from "react-router";

const ITEMS_PER_PAGE = 10;

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Event } = await import("~/lib/db/models/event.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";
  const filter = url.searchParams.get("filter") || "all";

  // Build query
  const query: Record<string, unknown> = {};

  if (status !== "all") {
    query.status = status;
  }

  // Filter by upcoming/past
  const now = new Date();
  if (filter === "upcoming") {
    query.date = { $gte: now };
  } else if (filter === "past") {
    query.date = { $lt: now };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  // Get total count
  const totalCount = await Event.countDocuments(query);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get events
  const events = await Event.find(query)
    .populate("createdBy", "name")
    .sort({ date: -1 })
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .lean();

  // Get stats
  const stats = {
    total: await Event.countDocuments(),
    published: await Event.countDocuments({ status: "published" }),
    draft: await Event.countDocuments({ status: "draft" }),
    upcoming: await Event.countDocuments({ status: "published", date: { $gte: now } }),
    featured: await Event.countDocuments({ isFeatured: true }),
  };

  return Response.json({
    events: events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      slug: e.slug,
      featuredImage: e.featuredImage,
      date: e.date?.toISOString(),
      endDate: e.endDate?.toISOString(),
      time: e.time,
      location: e.location,
      category: e.category,
      status: e.status,
      isFeatured: e.isFeatured,
      createdBy: e.createdBy,
      createdAt: e.createdAt?.toISOString(),
    })),
    stats,
    pagination: { page, totalPages, totalCount },
    currentStatus: status,
    currentFilter: filter,
    searchQuery: search,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Event } = await import("~/lib/db/models/event.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const eventId = formData.get("eventId") as string;

  if (intent === "delete") {
    await Event.findByIdAndDelete(eventId);
    return Response.json({ success: true, message: "Event deleted" });
  }

  if (intent === "toggle-status") {
    const event = await Event.findById(eventId);
    if (event) {
      event.status = event.status === "published" ? "draft" : "published";
      await event.save();
    }
    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "toggle-featured") {
    const event = await Event.findById(eventId);
    if (event) {
      event.isFeatured = !event.isFeatured;
      await event.save();
    }
    return Response.json({ success: true, message: "Featured status updated" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminEventsListingPage() {
  const { events, stats, pagination, currentStatus, currentFilter, searchQuery } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const handleTimeFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", filter);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const statusColors: Record<string, "success" | "warning" | "default"> = {
    published: "success",
    draft: "warning",
    archived: "default",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-sm text-gray-500">Create and manage company events</p>
        </div>
        <Button
          as={Link}
          to="/admin/events/new"
          color="primary"
          startContent={<Plus size={18} />}
        >
          Add Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "all" && currentFilter === "all" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => {
            handleStatusFilter("all");
            handleTimeFilter("all");
          }}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Events</p>
          </CardBody>
        </Card>
        <Card
          className={`cursor-pointer shadow-sm ${currentFilter === "upcoming" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleTimeFilter("upcoming")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            <p className="text-sm text-gray-500">Upcoming</p>
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
            <p className="text-2xl font-bold text-primary-600">{stats.featured}</p>
            <p className="text-sm text-gray-500">Featured</p>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Events</h2>
          <Input
            placeholder="Search events..."
            defaultValue={searchQuery}
            onValueChange={handleSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-xs"
          />
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="Events table" removeWrapper>
            <TableHeader>
              <TableColumn>EVENT</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No events found">
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={event.featuredImage || "https://via.placeholder.com/80x60?text=No+Image"}
                        alt={event.title}
                        className="h-12 w-16 rounded object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {event.title}
                        </p>
                        {event.category && (
                          <Chip size="sm" variant="flat" className="mt-1">
                            {event.category}
                          </Chip>
                        )}
                      </div>
                      {event.isFeatured && (
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {formatDate(event.date)}
                      </span>
                      {event.time && (
                        <span className="text-xs text-gray-500">{event.time}</span>
                      )}
                      {isUpcoming(event.date) ? (
                        <Chip size="sm" color="primary" variant="flat" className="mt-1 w-fit">
                          Upcoming
                        </Chip>
                      ) : (
                        <Chip size="sm" color="default" variant="flat" className="mt-1 w-fit">
                          Past
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={14} />
                      <span className="truncate max-w-[150px]">{event.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={statusColors[event.status]} variant="flat">
                      {event.status}
                    </Chip>
                  </TableCell>
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
                          href={`/events/${event.slug}`}
                          target="_blank"
                        >
                          View
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={16} />}
                          href={`/admin/events/${event.id}/edit`}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="toggle-status"
                          startContent={<Eye size={16} />}
                          onPress={() => {
                            const form = document.createElement("form");
                            form.method = "post";
                            form.innerHTML = `
                              <input type="hidden" name="intent" value="toggle-status" />
                              <input type="hidden" name="eventId" value="${event.id}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {event.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownItem>
                        <DropdownItem
                          key="toggle-featured"
                          startContent={<Star size={16} />}
                          onPress={() => {
                            const form = document.createElement("form");
                            form.method = "post";
                            form.innerHTML = `
                              <input type="hidden" name="intent" value="toggle-featured" />
                              <input type="hidden" name="eventId" value="${event.id}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {event.isFeatured ? "Remove Featured" : "Make Featured"}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          color="danger"
                          startContent={<Trash2 size={16} />}
                          onPress={() => {
                            if (confirm("Are you sure you want to delete this event?")) {
                              const form = document.createElement("form");
                              form.method = "post";
                              form.innerHTML = `
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="eventId" value="${event.id}" />
                              `;
                              document.body.appendChild(form);
                              form.submit();
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
    </div>
  );
}
