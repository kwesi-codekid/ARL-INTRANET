/**
 * Safety Hub Page - Video Playlist & Safety Tips
 * Auto-playing video playlist with safety tips carousel
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  ScrollShadow,
} from "@heroui/react";
import {
  Shield,
  Video,
  ArrowRight,
  AlertTriangle,
  HardHat,
  Flame,
  Eye,
  Heart,
  AlertOctagon,
  BookOpen,
  Award,
  ExternalLink,
  Users,
  Siren,
  Play,
  SkipForward,
  SkipBack,
  List,
  Lightbulb,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { MainLayout } from "~/components/layout";
import { VideoPlayer } from "~/components/ui";

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { SafetyTip } = await import("~/lib/db/models/safety-tip.server");
  const { SafetyVideo } = await import("~/lib/db/models/safety-video.server");
  const { Alert } = await import("~/lib/db/models/alert.server");
  const { AppLink } = await import("~/lib/db/models/app-link.server");

  await connectDB();

  const [tipCount, videoCount, alertCount, recentTips, allVideos, activeAlerts, hazardApp] = await Promise.all([
    SafetyTip.countDocuments({ status: "published" }),
    SafetyVideo.countDocuments({ status: "published" }),
    Alert.countDocuments({ isActive: true, type: "safety" }),
    SafetyTip.find({ status: "published" }).sort({ publishedAt: -1 }).limit(8).lean(),
    SafetyVideo.find({ status: "published" }).sort({ isFeatured: -1, publishedAt: -1 }).limit(20).lean(),
    Alert.find({ isActive: true, type: "safety" }).sort({ createdAt: -1 }).limit(3).lean(),
    AppLink.findOne({ name: { $regex: /hazard/i }, isActive: true }).lean(),
  ]);

  const daysSinceIncident = 47;

  return Response.json({
    stats: { tips: tipCount, videos: videoCount, alerts: alertCount, daysSinceIncident },
    tips: recentTips.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      slug: t.slug,
      summary: t.summary || "",
      category: t.category || "General",
      featuredImage: t.featuredImage,
    })),
    videos: allVideos.map((v) => ({
      id: v._id.toString(),
      title: v.title,
      description: v.description || "",
      thumbnail: v.thumbnail,
      videoUrl: v.videoUrl,
      duration: v.duration || 180,
    })),
    activeAlerts: activeAlerts.map((a) => ({
      id: a._id.toString(),
      title: a.title,
    })),
    hazardAppUrl: hazardApp?.url || "/apps",
  });
}

const emergencyContacts = [
  { name: "Line 1", number: "0544337142" },
  { name: "Line 2", number: "0501316835" },
  { name: "Line 3", number: "0544341880" },
];

// Quick access playlists (YouTube-style categories)
const quickPlaylists = [
  { title: "PPE", icon: HardHat, link: "/safety-tips?category=ppe", color: "#3B82F6", videoCount: 12 },
  { title: "Emergency", icon: Flame, link: "/safety-tips?category=emergency", color: "#EF4444", videoCount: 8 },
  { title: "First Aid", icon: Heart, link: "/safety-tips?category=firstaid", color: "#EC4899", videoCount: 15 },
  { title: "Awareness", icon: Eye, link: "/safety-tips?category=awareness", color: "#8B5CF6", videoCount: 10 },
  { title: "Training", icon: BookOpen, link: "/safety-videos", color: "#10B981", videoCount: 20 },
  { title: "Toolbox", icon: Users, link: "/toolbox-talk", color: "#06B6D4", videoCount: 6 },
];

export default function SafetyHubPage() {
  const { stats, tips, videos, activeAlerts, hazardAppUrl } = useLoaderData<typeof loader>();

  // Video playlist state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVideo = videos[currentVideoIndex];

  // Handle video ended - play next
  const handleVideoEnded = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
      setIsPlaying(true);
    } else {
      // Loop back to first video
      setCurrentVideoIndex(0);
      setIsPlaying(false);
    }
  };

  const handlePrevVideo = () => {
    setCurrentVideoIndex((prev) => (prev > 0 ? prev - 1 : videos.length - 1));
    setIsPlaying(true);
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev < videos.length - 1 ? prev + 1 : 0));
    setIsPlaying(true);
  };

  const handleSelectVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Top Bar - Title + Emergency + Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Safety Center</h1>
              <div className="flex items-center gap-2 text-base text-gray-300">
                <Award size={16} className="text-emerald-400" />
                <span>{stats.daysSinceIncident} days without incident</span>
              </div>
            </div>
          </div>

          {/* Emergency Numbers Inline */}
          <div className="flex items-center gap-3">
            <Siren size={22} className="text-red-400 animate-pulse" />
            <span className="text-base text-gray-400">Emergency:</span>
            {emergencyContacts.map((c, i) => (
              <a
                key={i}
                href={`tel:${c.number}`}
                className="bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded text-base font-bold transition-colors"
              >
                {c.number}
              </a>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-5">
            <Link to="/safety-tips" className="text-center hover:bg-white/10 px-4 py-2 rounded transition-colors">
              <p className="text-3xl font-bold">{stats.tips}</p>
              <p className="text-sm text-gray-400">Tips</p>
            </Link>
            <Link to="/safety-videos" className="text-center hover:bg-white/10 px-4 py-2 rounded transition-colors">
              <p className="text-3xl font-bold">{stats.videos}</p>
              <p className="text-sm text-gray-400">Videos</p>
            </Link>
            <Link to="/alerts" className="text-center hover:bg-white/10 px-4 py-2 rounded transition-colors">
              <p className="text-3xl font-bold">{stats.alerts}</p>
              <p className="text-sm text-gray-400">Alerts</p>
            </Link>
          </div>
        </div>

        {/* Active Alerts - Compact */}
        {activeAlerts.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertOctagon size={22} className="text-amber-600" />
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {activeAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  to="/alerts"
                  className="flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded text-base text-amber-800 hover:bg-amber-200 transition-colors whitespace-nowrap font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  {alert.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content - Playlist Sidebar + Video + Actions */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left Sidebar - YouTube-Style Playlists */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm sticky top-4">
              <CardBody className="p-0">
                <div className="py-2">
                  {quickPlaylists.map((playlist) => {
                    const Icon = playlist.icon;
                    return (
                      <Link
                        key={playlist.title}
                        to={playlist.link}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group border-l-3 border-transparent hover:border-emerald-500"
                      >
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: `${playlist.color}15` }}
                        >
                          <Icon size={24} style={{ color: playlist.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {playlist.title}
                          </p>
                          <p className="text-sm text-gray-500">{playlist.videoCount} videos</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Center Column - Video Player + Playlist */}
          <div className="lg:col-span-7 space-y-4">
            {/* Video Player */}
            <Card className="shadow-sm overflow-hidden">
              <CardBody className="p-0">
                {currentVideo ? (
                  <div className="relative group/video">
                    <VideoPlayer
                      key={currentVideo.id}
                      src={currentVideo.videoUrl}
                      title={currentVideo.title}
                      thumbnail={currentVideo.thumbnail}
                      autoPlay={isPlaying}
                      onPlay={() => setIsPlaying(true)}
                      onEnded={handleVideoEnded}
                    />

                    {/* Top overlay - Counter */}
                    <div className="absolute top-3 left-3 pointer-events-none z-10">
                      <Chip size="md" variant="flat" className="bg-black/70 text-white text-base">
                        <span className="font-semibold">{currentVideoIndex + 1}</span>
                        <span className="text-white/60"> / {videos.length}</span>
                      </Chip>
                    </div>

                    {/* Prev/Next navigation overlays - visible on hover */}
                    {videos.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevVideo}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover/video:opacity-100 transition-opacity z-10"
                        >
                          <SkipBack size={20} />
                        </button>
                        <button
                          onClick={handleNextVideo}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover/video:opacity-100 transition-opacity z-10"
                        >
                          <SkipForward size={20} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Video size={48} className="mx-auto mb-2" />
                      <p>No videos available</p>
                    </div>
                  </div>
                )}

                {/* Video Info Bar */}
                <div className="p-5 bg-gray-50 border-t">
                  <h3 className="font-bold text-lg text-gray-900">{currentVideo?.title || "No video selected"}</h3>
                  <p className="text-base text-gray-600 line-clamp-2 mt-2">{currentVideo?.description}</p>
                </div>
              </CardBody>
            </Card>

            {/* Video Playlist Below Player */}
            <Card className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <List size={20} className="text-gray-600" />
                    <span className="font-semibold text-base text-gray-900">Up Next</span>
                    <Chip size="md" variant="flat">{videos.length} videos</Chip>
                  </div>
                  <Button
                    as={Link}
                    to="/safety-videos"
                    size="md"
                    variant="light"
                    color="primary"
                    endContent={<ArrowRight size={16} />}
                  >
                    Browse All
                  </Button>
                </div>
                <ScrollShadow className="max-h-72">
                  <div className="space-y-2">
                    {videos.map((video, idx) => (
                      <button
                        key={video.id}
                        onClick={() => handleSelectVideo(idx)}
                        className={`w-full p-3 flex items-center gap-4 text-left rounded-lg transition-colors ${
                          idx === currentVideoIndex ? "bg-emerald-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-gray-200">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600" />
                          )}
                          {idx === currentVideoIndex && (
                            <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Play size={14} className="text-white ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-medium line-clamp-2 ${
                            idx === currentVideoIndex ? "text-emerald-700" : "text-gray-900"
                          }`}>
                            {video.title}
                          </p>
                        </div>
                        <span className="text-sm text-gray-400 flex-shrink-0">#{idx + 1}</span>
                      </button>
                    ))}
                  </div>
                </ScrollShadow>
              </CardBody>
            </Card>
          </div>

          {/* Right Sidebar - Actions + Tips */}
          <div className="lg:col-span-3 space-y-4">
            {/* Report Hazard Card */}
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg border-0">
              <CardBody className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Report Hazard</h3>
                    <p className="text-sm text-amber-100">See something unsafe?</p>
                  </div>
                </div>
                <Button
                  as="a"
                  href={hazardAppUrl}
                  target="_blank"
                  fullWidth
                  size="lg"
                  className="bg-white text-amber-600 font-bold text-base"
                  endContent={<ExternalLink size={18} />}
                >
                  Report Now
                </Button>
              </CardBody>
            </Card>

            {/* Safety Tips */}
            <Card className="shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={20} className="text-emerald-600" />
                    <span className="font-bold text-lg text-gray-900">Safety Tips</span>
                  </div>
                  <Button as={Link} to="/safety-tips" size="sm" variant="light" color="primary" isIconOnly>
                    <ArrowRight size={16} />
                  </Button>
                </div>
                <div className="space-y-3">
                  {tips.slice(0, 4).map((tip) => (
                    <Link
                      key={tip.id}
                      to={`/safety-tips/${tip.slug}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <p className="text-base font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-600">
                        {tip.title}
                      </p>
                      <Chip size="sm" variant="flat" className="bg-emerald-100 text-emerald-700 mt-2">
                        {tip.category}
                      </Chip>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
