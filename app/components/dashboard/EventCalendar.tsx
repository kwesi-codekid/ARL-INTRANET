/**
 * Event Calendar Widget using FullCalendar
 * Displays events in a mini calendar view for the home page
 */

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Spinner } from "@heroui/react";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Link, useFetcher } from "react-router";

interface CalendarEvent {
  id: string;
  title: string;
  slug: string;
  date: string;
  time?: string;
  location: string;
  category?: string;
  description: string;
  isFeatured: boolean;
}

interface EventCalendarProps {
  initialEvents?: CalendarEvent[];
  landscape?: boolean;
}

// Lazy load FullCalendar components to avoid SSR issues
interface FullCalendarModule {
  default: React.ComponentType<Record<string, unknown>>;
}

export function EventCalendar({ initialEvents = [], landscape = false }: EventCalendarProps) {
  const fetcher = useFetcher<{ events: CalendarEvent[] }>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [CalendarComponent, setCalendarComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [plugins, setPlugins] = useState<unknown[]>([]);

  // Load FullCalendar only on client side
  useEffect(() => {
    setIsClient(true);

    // Dynamically import FullCalendar
    Promise.all([
      import("@fullcalendar/react"),
      import("@fullcalendar/daygrid"),
      import("@fullcalendar/interaction"),
    ]).then(([fcModule, daygridModule, interactionModule]) => {
      setCalendarComponent(() => fcModule.default);
      setPlugins([daygridModule.default, interactionModule.default]);
    });
  }, []);

  // Fetch events if not provided
  useEffect(() => {
    if (initialEvents.length === 0) {
      fetcher.load("/api/events?limit=50");
    }
  }, []);

  const events = initialEvents.length > 0 ? initialEvents : (fetcher.data?.events || []);

  // Convert events to FullCalendar format
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date.split("T")[0],
    extendedProps: {
      ...event,
    },
    backgroundColor: event.isFeatured ? "#D4AF37" : "#1B365D",
    borderColor: event.isFeatured ? "#D4AF37" : "#1B365D",
  }));

  const handleEventClick = (info: { event: { extendedProps: Record<string, unknown> } }) => {
    const eventData = info.event.extendedProps as unknown as CalendarEvent;
    setSelectedEvent(eventData);
    setIsModalOpen(true);
  };

  const handleDateClick = (info: { dateStr: string }) => {
    // Find events on this date
    const dateEvents = events.filter(
      (e) => e.date.split("T")[0] === info.dateStr
    );
    if (dateEvents.length === 1) {
      setSelectedEvent(dateEvents[0]);
      setIsModalOpen(true);
    }
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center rounded-full bg-blue-100 ${landscape ? "h-10 w-10" : "h-9 w-9"}`}>
              <Calendar size={landscape ? 20 : 18} className="text-blue-600" />
            </div>
            <div>
              <h3 className={`font-semibold text-gray-900 ${landscape ? "text-base" : "text-sm"}`}>Events Calendar</h3>
              {landscape && <p className="text-xs text-gray-500">Click on events to view details</p>}
            </div>
          </div>
          <Button as={Link} to="/events" size="sm" variant="light" color="primary" endContent={<ArrowRight size={14} />}>
            All Events
          </Button>
        </CardHeader>
        <CardBody className="pt-0">
          <div className={landscape ? "event-calendar-landscape" : "event-calendar-widget"}>
            {isClient && CalendarComponent && plugins.length > 0 ? (
              <CalendarComponent
                plugins={plugins}
                initialView="dayGridMonth"
                events={calendarEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                headerToolbar={landscape ? {
                  left: "prev,next today",
                  center: "title",
                  right: "",
                } : {
                  left: "prev",
                  center: "title",
                  right: "next",
                }}
                height="auto"
                contentHeight="auto"
                aspectRatio={landscape ? 5 : 1.2}
                dayMaxEvents={landscape ? 2 : 2}
                moreLinkClick="popover"
                eventDisplay="block"
                eventTimeFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                }}
                titleFormat={{ year: "numeric", month: landscape ? "long" : "short" }}
                dayHeaderFormat={{ weekday: landscape ? "short" : "narrow" }}
                fixedWeekCount={false}
                showNonCurrentDates={false}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" color="warning" />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className={`flex items-center justify-center gap-4 text-xs ${landscape ? "mt-4 pt-3 border-t border-gray-100" : "mt-3"}`}>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[#1B365D]" />
              <span className="text-gray-600">Regular Event</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
              <span className="text-gray-600">Featured Event</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Event Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalContent>
          {selectedEvent && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
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
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedEvent.title}
                </h2>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <Calendar size={18} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatEventDate(selectedEvent.date)}</p>
                    </div>
                  </div>

                  {selectedEvent.time && (
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <Clock size={18} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{selectedEvent.time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <MapPin size={18} className="text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{selectedEvent.location}</p>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  )}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={() => setIsModalOpen(false)}>
                  Close
                </Button>
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
