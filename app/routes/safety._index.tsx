/**
 * Safety Hub Page - Video Playlist & Safety Tips
 * Follows the same design language as the homepage (home.tsx)
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
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";
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
  { name: "Emergency", number: "1111", alt: "0501316835" },
  { name: "Emergency", number: "0544341880" },
  { name: "IT Support", number: "1000", alt: "0544337551" },
];

const quickPlaylists = [
  { title: "PPE", icon: HardHat, link: "/safety-tips?category=ppe", color: "#3B82F6" },
  { title: "Emergency", icon: Flame, link: "/safety-tips?category=emergency", color: "#EF4444" },
  { title: "First Aid", icon: Heart, link: "/safety-tips?category=firstaid", color: "#EC4899" },
  { title: "Awareness", icon: Eye, link: "/safety-tips?category=awareness", color: "#8B5CF6" },
  { title: "Training", icon: BookOpen, link: "/safety-videos", color: "#10B981" },
  { title: "Toolbox", icon: Users, link: "/toolbox-talk", color: "#06B6D4" },
];

export default function SafetyHubPage() {
  const { stats, tips, videos, activeAlerts, hazardAppUrl } = useLoaderData<typeof loader>();
  const { portalUser } = useOutletContext<PublicOutletContext>();

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVideo = videos[currentVideoIndex];

  const handleVideoEnded = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
      setIsPlaying(true);
    } else {
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
    <MainLayout user={portalUser}>
      {/* ── Page Header ── */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
            <Shield size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Center</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Award size={14} className="text-emerald-500 flex-shrink-0" />
              <span>{stats.daysSinceIncident} days without incident</span>
            </div>
          </div>
        </div>

        {/* Stats + Emergency row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Link to="/safety-tips">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.tips}</p>
                <p className="text-xs text-gray-500">Tips</p>
              </CardBody>
            </Card>
          </Link>
          <Link to="/safety-videos">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.videos}</p>
                <p className="text-xs text-gray-500">Videos</p>
              </CardBody>
            </Card>
          </Link>
          <Link to="/alerts">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.alerts}</p>
                <p className="text-xs text-gray-500">Alerts</p>
              </CardBody>
            </Card>
          </Link>
        </div>

        {/* Emergency Contacts */}
        <div className="grid grid-cols-3 gap-3">
          {emergencyContacts.map((c, i) => (
            <a
              key={i}
              href={`tel:${c.number}`}
              className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 p-3 text-white shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <Phone size={16} className="group-hover:animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-red-100 uppercase tracking-wide">{c.name}</p>
                <p className="text-sm sm:text-base font-bold truncate">{c.number}{c.alt ? ` / ${c.alt}` : ""}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Active Alerts ── */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 sm:mb-6">
          <AlertOctagon size={22} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {activeAlerts.map((alert) => (
              <Chip
                key={alert.id}
                as={Link}
                to="/alerts"
                variant="flat"
                color="warning"
                className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                startContent={<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
              >
                {alert.title}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* ── Video Player Section ── */}
      <div className="mb-4 sm:mb-6 grid gap-4 lg:grid-cols-3">
        {/* Video Player */}
        <div className="lg:col-span-2">
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

                  {/* Counter badge */}
                  <div className="absolute top-3 left-3 pointer-events-none z-10">
                    <Chip size="sm" variant="flat" className="bg-black/70 text-white">
                      <span className="font-semibold">{currentVideoIndex + 1}</span>
                      <span className="text-white/60"> / {videos.length}</span>
                    </Chip>
                  </div>

                  {/* Prev/Next overlays */}
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

              {/* Video Info */}
              <div className="p-4 sm:p-5 border-t bg-white">
                <h3 className="font-bold text-lg text-gray-900">{currentVideo?.title || "No video selected"}</h3>
                {currentVideo?.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{currentVideo.description}</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Playlist Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm h-full">
            <CardBody className="p-0 flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Video size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-900">Playlist</span>
                  <Chip size="sm" variant="flat">{videos.length}</Chip>
                </div>
                <Button
                  as={Link}
                  to="/safety-videos"
                  size="sm"
                  variant="light"
                  color="primary"
                  endContent={<ArrowRight size={14} />}
                >
                  All
                </Button>
              </div>
              <ScrollShadow className="flex-1 max-h-[300px] lg:max-h-[400px]">
                <div className="divide-y divide-gray-100">
                  {videos.map((video, idx) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(idx)}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                        idx === currentVideoIndex ? "bg-emerald-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative flex-shrink-0 w-20 aspect-video rounded-lg overflow-hidden bg-gray-200">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600" />
                        )}
                        {idx === currentVideoIndex && (
                          <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Play size={12} className="text-white ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                        )}
                        <Chip
                          size="sm"
                          variant="flat"
                          className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] h-4 px-1"
                        >
                          {formatDuration(video.duration)}
                        </Chip>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium line-clamp-2 ${
                          idx === currentVideoIndex ? "text-emerald-700" : "text-gray-900"
                        }`}>
                          {video.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollShadow>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Quick Actions Row ── */}
      <div className="mb-4 sm:mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Report Hazard - prominent */}
        <Link
          to={hazardAppUrl}
          target="_blank"
          className="col-span-2 sm:col-span-3 lg:col-span-2 block"
        >
          <Card className="bg-gradient-to-r from-amber-500 to-orange-600 shadow-md hover:shadow-lg transition-shadow h-full">
            <CardBody className="p-4 flex flex-row items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">Report Hazard</h3>
                <p className="text-sm text-amber-100">See something unsafe? Report it now</p>
              </div>
              <ExternalLink size={20} className="flex-shrink-0 text-white/70" />
            </CardBody>
          </Card>
        </Link>

        {/* Category Quick Links */}
        {quickPlaylists.slice(0, 4).map((playlist) => {
          const Icon = playlist.icon;
          return (
            <Link key={playlist.title} to={playlist.link}>
              <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                <CardBody className="p-3 sm:p-4 flex flex-col items-center text-center gap-2">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${playlist.color}15` }}
                  >
                    <Icon size={22} style={{ color: playlist.color }} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-800">{playlist.title}</span>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── Safety Tips Section ── */}
      <div className="mb-8 lg:mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={20} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Safety Tips</h2>
          </div>
          <Button
            as={Link}
            to="/safety-tips"
            size="sm"
            variant="light"
            color="primary"
            endContent={<ArrowRight size={14} />}
          >
            View All
          </Button>
        </div>

        {tips.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {tips.slice(0, 8).map((tip) => (
              <Link key={tip.id} to={`/safety-tips/${tip.slug}`}>
                <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-full">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100">
                    {tip.featuredImage ? (
                      <img
                        src={tip.featuredImage}
                        alt={tip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shield size={36} className="text-emerald-300" />
                      </div>
                    )}
                    <Chip
                      size="sm"
                      variant="solid"
                      className="absolute top-2 left-2 bg-emerald-600 text-white"
                    >
                      {tip.category}
                    </Chip>
                  </div>
                  {/* Content */}
                  <CardBody className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {tip.title}
                    </h3>
                    {tip.summary && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{tip.summary}</p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="py-12 text-center">
              <Shield size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No safety tips yet</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for safety guidelines</p>
            </CardBody>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
