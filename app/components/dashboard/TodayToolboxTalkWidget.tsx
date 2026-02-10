/**
 * Weekly PSI Talk Widget
 * Task: 1.2.1.3.6 - Add homepage "This Week's PSI Talk" widget
 */

import { Card, CardBody, CardHeader, Button, Chip, Image } from "@heroui/react";
import { Shield, ArrowRight, PlayCircle, Volume2, Calendar } from "lucide-react";
import { Link } from "react-router";
import type { SerializedToolboxTalk } from "~/lib/services/toolbox-talk.server";

interface TodayToolboxTalkWidgetProps {
  talk: SerializedToolboxTalk | null;
  weekRange?: { start: string; end: string };
}

export function TodayToolboxTalkWidget({ talk, weekRange }: TodayToolboxTalkWidgetProps) {
  // Format week range for display
  const formatWeekRange = () => {
    if (!weekRange) return "Weekly safety briefing";
    const startDate = new Date(weekRange.start);
    const endDate = new Date(weekRange.end);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  if (!talk) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Shield size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">This Week's PSI Talk</h3>
            <p className="text-xs text-gray-500">{formatWeekRange()}</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No PSI talk scheduled for this week</p>
            <Button
              as={Link}
              to="/toolbox-talk"
              size="sm"
              variant="flat"
              color="primary"
              className="mt-3"
            >
              View Archive
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  const hasVideo = talk.featuredMedia?.type === "video";
  const hasAudio = talk.featuredMedia?.type === "audio";
  const thumbnail = talk.featuredMedia?.thumbnail || talk.featuredMedia?.url;

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="flex items-center gap-3 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <Shield size={20} className="text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">This Week's PSI Talk</h3>
            <Chip size="sm" color="success" variant="flat">
              Active
            </Chip>
          </div>
          <p className="text-xs text-gray-500">{formatWeekRange()}</p>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-3">
        {/* Thumbnail/Media Preview - Only show if there's an actual image */}
        {thumbnail && (
          <Link to={`/toolbox-talk/${talk.slug}`} className="block">
            <div className="relative h-40 w-full overflow-hidden rounded-lg">
              <Image
                src={thumbnail}
                alt={talk.title}
                className="h-full w-full object-cover"
                classNames={{ wrapper: "h-full w-full" }}
              />

              {/* Play overlay for video/audio */}
              {(hasVideo || hasAudio) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                    {hasVideo ? (
                      <PlayCircle size={24} className="text-green-600" />
                    ) : (
                      <Volume2 size={24} className="text-green-600" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Talk Title & Summary */}
        <div>
          <Link
            to={`/toolbox-talk/${talk.slug}`}
            className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
          >
            {talk.title}
          </Link>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{talk.summary}</p>
        </div>

        {/* Tags */}
        {talk.tags && talk.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {talk.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} size="sm" variant="flat" color="warning">
                {tag}
              </Chip>
            ))}
            {talk.tags.length > 3 && (
              <Chip size="sm" variant="flat">
                +{talk.tags.length - 3}
              </Chip>
            )}
          </div>
        )}

        {/* View Button */}
        <Button
          as={Link}
          to={`/toolbox-talk/${talk.slug}`}
          color="success"
          variant="flat"
          fullWidth
          endContent={<ArrowRight size={16} />}
        >
          Read This Week's PSI Talk
        </Button>
      </CardBody>
    </Card>
  );
}

export default TodayToolboxTalkWidget;
