/**
 * PSI Talk Calendar View
 * Task: 1.2.1.4.6 - Add calendar view for scheduled talks
 */

import { useState, useMemo } from "react";
import { Card, CardBody, Button, Chip, Tooltip } from "@heroui/react";
import { ChevronLeft, ChevronRight, PlayCircle, Volume2, Calendar, Plus } from "lucide-react";
import { Link } from "react-router";
import type { SerializedToolboxTalk } from "~/lib/services/toolbox-talk.server";

interface ToolboxTalkCalendarProps {
  talks: SerializedToolboxTalk[];
  initialMonth?: Date;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function ToolboxTalkCalendar({ talks, initialMonth }: ToolboxTalkCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialMonth || new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar grid data
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Create a map of talks by date
    const talksByDate = new Map<string, SerializedToolboxTalk[]>();
    talks.forEach((talk) => {
      const talkDate = new Date(talk.scheduledDate);
      const dateKey = `${talkDate.getFullYear()}-${talkDate.getMonth()}-${talkDate.getDate()}`;
      if (!talksByDate.has(dateKey)) {
        talksByDate.set(dateKey, []);
      }
      talksByDate.get(dateKey)?.push(talk);
    });

    // Build calendar grid
    const days: Array<{
      date: Date | null;
      isCurrentMonth: boolean;
      isToday: boolean;
      talks: SerializedToolboxTalk[];
    }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false, isToday: false, talks: [] });
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${year}-${month}-${day}`;
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        talks: talksByDate.get(dateKey) || [],
      });
    }

    // Add empty cells to complete the last week
    const remainingCells = 7 - (days.length % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        days.push({ date: null, isCurrentMonth: false, isToday: false, talks: [] });
      }
    }

    return days;
  }, [year, month, talks]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const getMediaIcon = (talk: SerializedToolboxTalk) => {
    if (talk.featuredMedia?.type === "video") {
      return <PlayCircle size={10} className="text-blue-500" />;
    }
    if (talk.featuredMedia?.type === "audio") {
      return <Volume2 size={10} className="text-purple-500" />;
    }
    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardBody className="p-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={goToPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </Button>
            <h2 className="text-lg font-semibold min-w-[150px] text-center">
              {MONTHS[month]} {year}
            </h2>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="flat" onPress={goToToday}>
              Today
            </Button>
            <Button
              as={Link}
              to="/admin/toolbox-talks/new"
              size="sm"
              color="primary"
              startContent={<Plus size={14} />}
            >
              Add Talk
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-gray-500 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[100px] border-b border-r p-1 ${
                  !day.isCurrentMonth ? "bg-gray-50" : "bg-white"
                } ${day.isToday ? "bg-primary-50" : ""}`}
              >
                {day.date && (
                  <>
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${
                          day.isToday
                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {day.talks.length === 0 && day.isCurrentMonth && (
                        <Tooltip content="Schedule a talk">
                          <Link
                            to={`/admin/toolbox-talks/new?date=${day.date.toISOString().split("T")[0]}`}
                            className="opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <Plus size={14} className="text-gray-400 hover:text-primary-500" />
                          </Link>
                        </Tooltip>
                      )}
                    </div>

                    {/* Talks for this day */}
                    <div className="space-y-1">
                      {day.talks.slice(0, 2).map((talk) => (
                        <Tooltip
                          key={talk.id}
                          content={
                            <div className="max-w-[200px]">
                              <p className="font-medium">{talk.title}</p>
                              <p className="text-xs text-gray-400 capitalize">{talk.status}</p>
                            </div>
                          }
                        >
                          <Link
                            to={`/admin/toolbox-talks/${talk.id}/edit`}
                            className="block"
                          >
                            <div
                              className={`text-xs p-1 rounded truncate flex items-center gap-1 ${
                                talk.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : talk.status === "draft"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {getMediaIcon(talk)}
                              <span className="truncate">{talk.title}</span>
                            </div>
                          </Link>
                        </Tooltip>
                      ))}
                      {day.talks.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{day.talks.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            <span>Published</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
            <span>Archived</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <PlayCircle size={12} className="text-blue-500" />
            <span>Has Video</span>
            <Volume2 size={12} className="text-purple-500" />
            <span>Has Audio</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default ToolboxTalkCalendar;
