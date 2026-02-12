/**
 * Featured Safety Video Widget
 * Task: 1.2.2.3.6 - Add homepage featured video widget
 */

import { Card, CardBody, CardHeader, Button, Chip } from "@heroui/react";
import { Video, Play, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router";
import type { SerializedSafetyVideo } from "~/lib/services/safety.server";

interface SafetyVideoWidgetProps {
  video: SerializedSafetyVideo | null;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SafetyVideoWidget({ video }: SafetyVideoWidgetProps) {
  if (!video) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Video size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Safety Video</h3>
            <p className="text-xs text-gray-500">Featured training</p>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <Video size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No featured video</p>
            <Button
              as={Link}
              to="/safety-videos"
              size="sm"
              variant="flat"
              color="primary"
              className="mt-3"
            >
              Browse Videos
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="flex items-center gap-3 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <Video size={20} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Safety Video</h3>
            <Chip size="sm" color="primary" variant="flat">
              Featured
            </Chip>
          </div>
          <p className="text-xs text-gray-500">Watch & learn</p>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-3">
        {/* Video Thumbnail */}
        <Link to={`/safety-videos?play=${video.id}`} className="block">
          <div className="relative h-36 w-full overflow-hidden rounded-lg bg-gray-100">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <Video size={32} className="text-blue-300" />
              </div>
            )}
            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                <Play size={24} className="text-blue-600 ml-1" />
              </div>
            </div>
            {/* Duration Badge */}
            {video.duration > 0 && (
              <Chip
                size="sm"
                variant="flat"
                className="absolute bottom-2 right-2 bg-black/70 text-white"
                startContent={<Clock size={10} />}
              >
                {formatDuration(video.duration)}
              </Chip>
            )}
          </div>
        </Link>

        <div>
          {video.category && (
            <Chip
              size="sm"
              variant="flat"
              className="mb-2"
              style={{
                backgroundColor: `${video.category.color}20`,
                color: video.category.color,
              }}
            >
              {video.category.name}
            </Chip>
          )}
          <h4 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h4>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{video.description}</p>
        </div>

        <Button
          as={Link}
          to="/safety-videos"
          color="primary"
          variant="flat"
          fullWidth
          endContent={<ArrowRight size={16} />}
        >
          View All Videos
        </Button>
      </CardBody>
    </Card>
  );
}

export default SafetyVideoWidget;
