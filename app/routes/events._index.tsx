/**
 * Events Listing Page
 * Task: 1.3.1.3 - Public Events UI
 * Task: 1.3.1.3.5 - Event Calendar View
 */

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Card,
  CardBody,
  Button,
  ButtonGroup,
  Chip,
  Image,
  Input,
  Select,
  SelectItem,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
} from "@heroui/react";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Users,
  Search,
  List,
  Grid3X3,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useSearchParams, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";

const ITEMS_PER_PAGE = 10;

// Event categories
const EVENT_CATEGORIES = [
  "Company Event",
  "Safety Training",
  "Team Building",
  "Workshop",
  "Meeting",
  "Celebration",
  "Community",
  "Other",
];

interface SerializedEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  time?: string;
  endDate?: string;
  location: string;
  category?: string;
  featuredImage?: string;
  organizer?: string;
  isFeatured: boolean;
  registrationRequired: boolean;
  registrationLink?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Event } = await import("~/lib/db/models/event.server");

  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const filter = url.searchParams.get("filter") || "upcoming";
  const page = parseInt(url.searchParams.get("page") || "1");
  const view = url.searchParams.get("view") || "list";

  const now = new Date();

  // Build query
  const query: Record<string, unknown> = { status: "published" };

  // Filter by upcoming or past (only for list view)
  if (view === "list") {
    if (filter === "upcoming") {
      query.date = { $gte: now };
    } else if (filter === "past") {
      query.date = { $lt: now };
    }
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Fuzzy search
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
      { organizer: searchRegex },
    ];
  }

  // Get total count
  const totalCount = await Event.countDocuments(query);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // For calendar view, fetch more events (up to 100 for the year)
  // For list view, use pagination
  const limit = view === "calendar" ? 100 : ITEMS_PER_PAGE;
  const skip = view === "calendar" ? 0 : (page - 1) * ITEMS_PER_PAGE;

  // Get events
  const sortOrder = filter === "past" ? -1 : 1;
  const events = await Event.find(query)
    .sort({ date: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  // Serialize events
  const serializedEvents: SerializedEvent[] = events.map((e) => ({
    id: e._id.toString(),
    title: e.title,
    slug: e.slug,
    description: e.description,
    date: e.date.toISOString(),
    time: e.time,
    endDate: e.endDate?.toISOString(),
    location: e.location,
    category: e.category,
    featuredImage: e.featuredImage,
    organizer: e.organizer,
    isFeatured: e.isFeatured,
    registrationRequired: e.registrationRequired,
    registrationLink: e.registrationLink,
  }));

  // Get counts for tabs
  const [upcomingCount, pastCount] = await Promise.all([
    Event.countDocuments({ status: "published", date: { $gte: now } }),
    Event.countDocuments({ status: "published", date: { $lt: now } }),
  ]);

  return Response.json({
    events: serializedEvents,
    pagination: { page, totalPages, totalCount },
    counts: { upcoming: upcomingCount, past: pastCount },
    filters: { search, category, filter, view },
  });
}

function formatEventDate(dateString: string): {
  month: string;
  day: string;
  full: string;
} {
  const date = new Date(dateString);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.getDate().toString(),
    full: date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

// Calendar View Component
function EventCalendarView({ events }: { events: SerializedEvent[] }) {
  const [selectedEvent, setSelectedEvent] = useState<SerializedEvent | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Convert events to FullCalendar format
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.date.split("T")[0],
    end: event.endDate ? event.endDate.split("T")[0] : undefined,
    extendedProps: { ...event },
    backgroundColor: event.isFeatured ? "#D4AF37" : "#1B365D",
    borderColor: event.isFeatured ? "#D4AF37" : "#1B365D",
  }));

  const handleEventClick = (info: {
    event: { extendedProps: Record<string, unknown> };
  }) => {
    const eventData = info.event.extendedProps as unknown as SerializedEvent;
    setSelectedEvent(eventData);
    setIsModalOpen(true);
  };

  const handleDateClick = (info: { dateStr: string }) => {
    const dateEvents = events.filter(
      (e) => e.date.split("T")[0] === info.dateStr
    );
    if (dateEvents.length === 1) {
      setSelectedEvent(dateEvents[0]);
      setIsModalOpen(true);
    }
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!isMounted) {
    return (
      <Card className="shadow-sm">
        <CardBody className="p-4 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-12 rounded-lg w-40" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-11 rounded-lg w-28" />
                <Skeleton className="h-10 rounded-lg w-16" />
              </div>
            </div>
            <Skeleton className="rounded-xl w-full h-96" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardBody className="p-4 md:p-6">
          <div className="events-calendar-full">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
              height="auto"
              contentHeight="auto"
              aspectRatio={1.5}
              dayMaxEvents={3}
              moreLinkClick="popover"
              eventDisplay="block"
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
              titleFormat={{ year: "numeric", month: "long" }}
              dayHeaderFormat={{ weekday: "short" }}
              fixedWeekCount={false}
              nowIndicator={true}
              navLinks={true}
            />
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 border-t pt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#1B365D]" />
              <span className="text-gray-600">Regular Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#D4AF37]" />
              <span className="text-gray-600">Featured Event</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Event Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <ModalContent>
          {selectedEvent && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedEvent.isFeatured && (
                    <Chip size="sm" color="warning" variant="flat">
                      Featured
                    </Chip>
                  )}
                  {selectedEvent.category && (
                    <Chip size="sm" variant="flat">
                      {selectedEvent.category}
                    </Chip>
                  )}
                  {new Date(selectedEvent.date) < new Date() && (
                    <Chip size="sm" color="default" variant="flat">
                      Past Event
                    </Chip>
                  )}
                </div>
                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {selectedEvent.title}
                </h2>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <Calendar size={18} className="shrink-0 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {formatFullDate(selectedEvent.date)}
                      </p>
                      {selectedEvent.endDate && (
                        <p className="text-sm text-gray-500">
                          to {formatFullDate(selectedEvent.endDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedEvent.time && (
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <Clock size={18} className="shrink-0 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{selectedEvent.time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <MapPin size={18} className="shrink-0 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{selectedEvent.location}</p>
                    </div>
                  </div>

                  {selectedEvent.organizer && (
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <Users size={18} className="shrink-0 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Organizer</p>
                        <p className="font-medium">{selectedEvent.organizer}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <p className="pt-2 text-sm leading-relaxed text-gray-600">
                      {selectedEvent.description}
                    </p>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={() => setIsModalOpen(false)}>
                  Close
                </Button>
                {new Date(selectedEvent.date) > new Date() &&
                  selectedEvent.registrationRequired &&
                  selectedEvent.registrationLink && (
                    <Button
                      as="a"
                      href={selectedEvent.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="secondary"
                    >
                      Register
                    </Button>
                  )}
                <Button
                  as={Link}
                  to={`/events/${selectedEvent.slug}`}
                  color="primary"
                  endContent={<ArrowRight size={16} />}
                >
                  View Details
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

function EventCard({
  event,
  isPast = false,
}: {
  event: SerializedEvent;
  isPast?: boolean;
}) {
  const dateInfo = formatEventDate(event.date);

  return (
    <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <CardBody className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Featured Image - Full height on left */}
          {event.featuredImage ? (
            <Link
              to={`/events/${event.slug}`}
              className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48 md:w-56"
            >
              <Image
                src={event.featuredImage}
                alt={event.title}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                radius="none"
              />
              {/* Date Badge Overlay */}
              <div
                className={`absolute top-2 left-2 flex flex-col items-center justify-center rounded-lg px-3 py-1.5 ${isPast ? "bg-gray-800/80" : "bg-primary-600/90"}`}
              >
                <span className="text-xs font-medium text-white">
                  {dateInfo.month}
                </span>
                <span className="text-xl leading-tight font-bold text-white">
                  {dateInfo.day}
                </span>
              </div>
            </Link>
          ) : (
            /* Date Badge without image */
            <div
              className={`flex w-full shrink-0 flex-col items-center justify-center py-4 sm:w-20 sm:py-0 ${isPast ? "bg-gray-100" : "bg-primary-50"}`}
            >
              <span
                className={`text-sm font-medium ${isPast ? "text-gray-500" : "text-primary-600"}`}
              >
                {dateInfo.month}
              </span>
              <span
                className={`text-2xl font-bold ${isPast ? "text-gray-700" : "text-primary-700"}`}
              >
                {dateInfo.day}
              </span>
            </div>
          )}

          {/* Event Details */}
          <div className="flex-1 p-3 sm:p-4">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {event.isFeatured && (
                <Chip size="sm" color="warning" variant="flat">
                  Featured
                </Chip>
              )}
              {event.category && (
                <Chip size="sm" variant="flat">
                  {event.category}
                </Chip>
              )}
              {isPast && (
                <Chip size="sm" color="default" variant="flat">
                  Past Event
                </Chip>
              )}
            </div>

            <Link
              to={`/events/${event.slug}`}
              className="hover:text-primary-600 line-clamp-1 text-base font-semibold text-gray-900"
            >
              {event.title}
            </Link>

            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {event.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {event.time && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {event.time}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {event.location}
              </span>
              {event.organizer && (
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {event.organizer}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              <Button
                as={Link}
                to={`/events/${event.slug}`}
                size="sm"
                variant="flat"
                color="primary"
                endContent={<ArrowRight size={14} />}
              >
                View Details
              </Button>

              {!isPast &&
                event.registrationRequired &&
                event.registrationLink && (
                  <Button
                    as="a"
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    color="primary"
                  >
                    Register
                  </Button>
                )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function EventsPage() {
  const { events, pagination, counts, filters } = useLoaderData<{
    events: SerializedEvent[];
    pagination: { page: number; totalPages: number; totalCount: number };
    counts: { upcoming: number; past: number };
    filters: { search: string; category: string; filter: string; view: string };
  }>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentView = filters.view || "list";

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

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("filter", filter);
    params.delete("page");
    setSearchParams(params);
  };

  const handleViewChange = (view: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", view);
    // Reset pagination when switching views
    params.delete("page");
    // Reset time filter when switching to calendar (shows all events)
    if (view === "calendar") {
      params.delete("filter");
    }
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const isPast = filters.filter === "past";

  return (
    <MainLayout user={portalUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-500">Company events and activities</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <ButtonGroup size="sm" variant="flat">
              <Button
                color={currentView === "list" ? "primary" : "default"}
                onPress={() => handleViewChange("list")}
                startContent={<List size={16} />}
              >
                List
              </Button>
              <Button
                color={currentView === "calendar" ? "primary" : "default"}
                onPress={() => handleViewChange("calendar")}
                startContent={<Grid3X3 size={16} />}
              >
                Calendar
              </Button>
            </ButtonGroup>
            <div className="bg-primary-100 hidden h-12 w-12 items-center justify-center rounded-full sm:flex">
              <Calendar size={24} className="text-primary-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-sm">
          <CardBody className="gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                placeholder="Search events..."
                startContent={<Search size={18} className="text-gray-400" />}
                defaultValue={filters.search}
                onValueChange={handleSearch}
                className="flex-1"
                classNames={{ inputWrapper: "bg-gray-50" }}
              />
              <Select
                placeholder="All Categories"
                selectedKeys={filters.category ? [filters.category] : []}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full sm:w-56"
                classNames={{ trigger: "bg-gray-50" }}
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} textValue={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Filter Chips - Only show for list view */}
            {currentView === "list" && (
              <div className="flex flex-wrap gap-2">
                <Chip
                  as="button"
                  variant={filters.filter === "upcoming" ? "solid" : "flat"}
                  color={filters.filter === "upcoming" ? "primary" : "default"}
                  className="cursor-pointer transition-all"
                  onClick={() => handleFilterChange("upcoming")}
                >
                  Upcoming ({counts.upcoming})
                </Chip>
                <Chip
                  as="button"
                  variant={filters.filter === "past" ? "solid" : "flat"}
                  color={filters.filter === "past" ? "primary" : "default"}
                  className="cursor-pointer transition-all"
                  onClick={() => handleFilterChange("past")}
                >
                  Past Events ({counts.past})
                </Chip>
                <Chip
                  as="button"
                  variant={filters.filter === "all" ? "solid" : "flat"}
                  color={filters.filter === "all" ? "primary" : "default"}
                  className="cursor-pointer transition-all"
                  onClick={() => handleFilterChange("all")}
                >
                  All Events
                </Chip>
              </div>
            )}

            {/* Calendar view info */}
            {currentView === "calendar" && (
              <p className="text-sm text-gray-500">
                Showing all {events.length} events. Click on an event to view
                details.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Calendar View */}
        {currentView === "calendar" && <EventCalendarView events={events} />}

        {/* List View */}
        {currentView === "list" && (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {events.length} of {pagination.totalCount} events
              </p>
            </div>

            {/* Events List */}
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isPast={isPast || new Date(event.date) < new Date()}
                  />
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardBody className="py-12 text-center">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No events found</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  total={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  showControls
                  color="primary"
                />
              </div>
            )}
          </>
        )}

        {/* Gallery Link */}
        <Card className="from-primary-50 to-primary-100 bg-gradient-to-r shadow-sm">
          <CardBody className="flex flex-row items-center justify-between p-6">
            <div>
              <h3 className="font-semibold text-gray-900">Event Photos</h3>
              <p className="text-sm text-gray-600">
                Browse photos from our past events and activities
              </p>
            </div>
            <Button
              as={Link}
              to="/gallery"
              color="primary"
              endContent={<ArrowRight size={16} />}
            >
              View Gallery
            </Button>
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
}
