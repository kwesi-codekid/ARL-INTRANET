import type {
  SerializedSafetyVideo,
  SerializedSafetyTip,
} from "~/lib/services/safety.server";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Chip,
  Avatar,
} from "@heroui/react";
import {
  MessageCircle,
  Share2,
  Shield,
  ArrowRight,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video,
  Lightbulb,
  FileText,
  ExternalLink,
  Zap,
  Keyboard,
  Monitor,
  Cpu,
  HelpCircle,
  Pin,
  Car,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";
import { AlertToast } from "~/components/alerts";
import {
  getResponsiveUrl,
  generateSrcSet,
  generateSizes,
  getOptimizedVideoUrl,
  isCloudinaryUrl,
} from "~/components/ui";

import { buildSlides } from "~/components/dashboard";
import type { CompanyImages } from "~/components/dashboard";

// Loader for homepage data
export async function loader({ request }: LoaderFunctionArgs) {
  const {
    getSafetyVideos,
    getSafetyTips,
    serializeSafetyVideo,
    serializeSafetyTip,
  } = await import("~/lib/services/safety.server");
  const { getActiveITTips } = await import("~/lib/services/it-tip.server");
  const { getActiveExecutiveMessages } =
    await import("~/lib/services/executive-message.server");
  const { getCompanyImages } =
    await import("~/lib/services/company-info.server");
  const { getUpcomingEvents, serializeEvent } =
    await import("~/lib/services/event.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");
  const { Alert } = await import("~/lib/db/models/alert.server");

  await connectDB();

  const [
    recentNews,
    featuredNews,
    activeAlerts,
    safetyVideosResult,
    safetyTipsResult,
    itTips,
    executiveMessages,
    companyImages,
    upcomingEvents,
  ] = await Promise.all([
    News.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(5)
      .populate("category")
      .populate("author", "name")
      .lean(),
    // Fetch featured news separately so they always appear in carousel
    News.find({ status: "published", isFeatured: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(5)
      .populate("category")
      .populate("author", "name")
      .lean(),
    Alert.find({ isActive: true })
      .sort({ severity: -1, createdAt: -1 })
      .limit(3)
      .lean(),
    // Fetch safety videos marked for slideshow
    getSafetyVideos({ status: "published", showInSlideshow: true, limit: 10 }),
    // Fetch safety tips marked for slideshow (with images or PDFs)
    getSafetyTips({ status: "published", showInSlideshow: true, limit: 10 }),
    // Fetch active IT tips
    getActiveITTips(5),
    // Fetch active executive messages
    getActiveExecutiveMessages(),
    // Fetch company images for slideshow
    getCompanyImages(),
    // Fetch upcoming events for highlights
    getUpcomingEvents(2),
  ]);

  // Serialize news helper
  const serializeNews = (news: (typeof recentNews)[0]) => ({
    id: news._id.toString(),
    title: news.title,
    slug: news.slug,
    excerpt: news.excerpt || "",
    featuredImage: news.featuredImage || null,
    category: news.category
      ? {
          name: (news.category as { name?: string }).name || "General",
          color: (news.category as { color?: string }).color || "#D4AF37",
        }
      : { name: "General", color: "#D4AF37" },
    author: news.author
      ? {
          name: (news.author as { name?: string }).name || "Admin",
        }
      : { name: "Admin" },
    publishedAt:
      news.publishedAt?.toISOString() || news.createdAt.toISOString(),
    isPinned: news.isPinned,
    isFeatured: news.isFeatured || false,
  });

  // Merge featured news into recent news, avoiding duplicates
  const recentNewsIds = new Set(recentNews.map((n) => n._id.toString()));
  const extraFeatured = featuredNews.filter(
    (n) => !recentNewsIds.has(n._id.toString())
  );
  const allNews = [...recentNews, ...extraFeatured];

  return Response.json({
    recentNews: allNews.map(serializeNews),
    activeAlerts: activeAlerts.map((alert) => ({
      id: alert._id.toString(),
      title: alert.title,
      message: alert.message,
      type: alert.type,
      severity: alert.severity as "critical" | "warning" | "info",
    })),
    safetyVideos: safetyVideosResult.videos.map(serializeSafetyVideo),
    safetyTips: safetyTipsResult.tips.map(serializeSafetyTip),
    itTips: itTips.map((tip) => ({
      id: tip._id.toString(),
      title: tip.title,
      content: tip.content,
      icon: tip.icon,
      category: tip.category,
      isPinned: tip.isPinned,
    })),
    executiveMessages: executiveMessages.map((msg) => ({
      id: msg._id.toString(),
      name: msg.name,
      title: msg.title,
      photo: msg.photo,
      message: msg.message,
    })),
    companyImages,
    upcomingEvents: upcomingEvents.map(serializeEvent),
  });
}

interface LoaderData {
  recentNews: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string | null;
    category: { name: string; color: string };
    author: { name: string };
    publishedAt: string;
    isPinned: boolean;
    isFeatured: boolean;
  }>;
  activeAlerts: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    severity: "critical" | "warning" | "info";
  }>;
  safetyVideos: SerializedSafetyVideo[];
  safetyTips: SerializedSafetyTip[];
  itTips: Array<{
    id: string;
    title: string;
    content: string;
    icon: string;
    category: string;
    isPinned: boolean;
  }>;
  executiveMessages: Array<{
    id: string;
    name: string;
    title: string;
    photo: string;
    message: string;
  }>;
  companyImages: CompanyImages;
  upcomingEvents: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    date: string;
    endDate?: string;
    time?: string;
    location: string;
    category?: string;
    isFeatured: boolean;
    featuredImage?: string;
  }>;
}

// Type for carousel items (news, safety videos, safety tips, PDFs, company values)
type CarouselItem =
  | { type: "news"; data: LoaderData["recentNews"][0] }
  | { type: "video"; data: SerializedSafetyVideo }
  | { type: "tip"; data: SerializedSafetyTip }
  | { type: "pdf"; data: SerializedSafetyTip } // PDF documents from safety tips
  | {
      type: "company";
      data: { id: string; title: string; image: string; alt: string };
    }; // Company values slides

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Helper to get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// IT Tips Slideshow Component - Shows ONE big readable tip at a time
function ITTipsSlideshow({ tips }: { tips: LoaderData["itTips"] }) {
  const [currentTip, setCurrentTip] = useState(0);

  // Auto-rotate tips every 8 seconds
  useEffect(() => {
    if (tips.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [tips.length]);

  // Category styling
  const categoryIcons: Record<string, typeof Lightbulb> = {
    security: Shield,
    productivity: Zap,
    shortcuts: Keyboard,
    software: Monitor,
    hardware: Cpu,
    general: HelpCircle,
  };

  const categoryColors: Record<
    string,
    { bg: string; text: string; gradient: string }
  > = {
    security: {
      bg: "bg-red-100",
      text: "text-red-600",
      gradient: "from-red-500 to-rose-500",
    },
    productivity: {
      bg: "bg-green-100",
      text: "text-green-600",
      gradient: "from-green-500 to-emerald-500",
    },
    shortcuts: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      gradient: "from-blue-500 to-indigo-500",
    },
    software: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      gradient: "from-purple-500 to-violet-500",
    },
    hardware: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      gradient: "from-orange-500 to-amber-500",
    },
    general: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      gradient: "from-gray-500 to-slate-500",
    },
  };

  if (tips.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
        <CardBody className="flex flex-col items-center justify-center py-8">
          <Lightbulb size={36} className="mb-2 text-gray-300" />
          <p className="font-medium text-gray-500">No IT Tips Available</p>
          <p className="text-sm text-gray-400">
            Check back later for helpful tips
          </p>
        </CardBody>
      </Card>
    );
  }

  // Ensure currentTip is within bounds
  const safeTipIndex = currentTip >= tips.length ? 0 : currentTip;
  const tip = tips[safeTipIndex];
  const TipIcon = categoryIcons[tip.category] || Lightbulb;
  const colors = categoryColors[tip.category] || categoryColors.general;

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="flex flex-col">
        {/* Header with gradient based on category */}
        <div className={`bg-gradient-to-r ${colors.gradient} p-5 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <TipIcon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">IT Tip of the Moment</h3>
                <p className="text-sm text-white/80 capitalize">
                  {tip.category}
                </p>
              </div>
            </div>
            {tip.isPinned && (
              <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                <Pin size={10} />
                <span>Pinned</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <CardBody className={`bg-gradient-to-br p-5 ${colors.bg} to-white`}>
          <div className="mb-3">
            <h4 className={`text-xl font-extrabold ${colors.text} mb-1`}>
              {tip.title}
            </h4>
            <div
              className={`h-1 w-16 rounded-full bg-gradient-to-r ${colors.gradient}`}
            />
          </div>
          <div
            className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${colors.text.replace("text-", "border-")}`}
          >
            <p className="text-lg leading-relaxed font-semibold text-gray-800">
              {tip.content}
            </p>
          </div>
        </CardBody>

        {/* Navigation Footer */}
        {tips.length > 1 && (
          <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2">
            {/* Dot Indicators */}
            <div className="flex gap-1.5">
              {tips.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTip(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === safeTipIndex
                      ? `w-6 ${colors.bg.replace("bg-", "bg-")}`
                      : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  style={{
                    backgroundColor:
                      idx === safeTipIndex
                        ? colors.gradient.includes("blue")
                          ? "#3b82f6"
                          : undefined
                        : undefined,
                  }}
                  aria-label={`Go to tip ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex gap-1">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() =>
                  setCurrentTip(
                    (prev) => (prev - 1 + tips.length) % tips.length
                  )
                }
                aria-label="Previous tip"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() =>
                  setCurrentTip((prev) => (prev + 1) % tips.length)
                }
                aria-label="Next tip"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Executive Messages Slideshow Component
function ExecutiveMessagesCard({
  messages,
  currentSlide,
  setCurrentSlide,
}: {
  messages: LoaderData["executiveMessages"];
  currentSlide: number;
  setCurrentSlide: (value: number | ((prev: number) => number)) => void;
}) {
  // Only show messages from the database
  const messagesToShow = messages;

  if (messagesToShow.length === 0) return null;

  // Auto-rotate executive messages
  useEffect(() => {
    if (messagesToShow.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % messagesToShow.length);
    }, 60000); // 60 seconds per slide
    return () => clearInterval(timer);
  }, [messagesToShow.length, setCurrentSlide]);

  // Reset slide if it's out of bounds
  const safeSlide = currentSlide >= messagesToShow.length ? 0 : currentSlide;
  const currentExec = messagesToShow[safeSlide];

  return (
    <Card className="mb-6 overflow-hidden shadow-sm">
      <CardBody className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Executive Image */}
          <div className="relative flex-shrink-0 sm:w-48 md:w-56">
            <img
              src={currentExec.photo}
              alt={currentExec.name}
              className="h-48 w-full object-cover object-top sm:h-full"
            />
            {/* Slide indicators on image */}
            {messagesToShow.length > 1 && (
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                {messagesToShow.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === safeSlide ? "w-4 bg-white" : "w-1.5 bg-white/50"
                    }`}
                    aria-label={`Go to message ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Welcome Message */}
          <div className="relative flex flex-1 flex-col justify-center bg-gradient-to-r from-gray-50 to-white p-5 sm:p-6">
            <p className="text-primary-600 mb-1 text-xs font-semibold tracking-wider uppercase">
              Message from Leadership
            </p>
            <h3 className="mb-2 text-lg font-bold text-gray-900 sm:text-xl">
              Welcome to ARL Intranet
            </h3>
            <p className="mb-3 text-sm leading-relaxed text-gray-600">
              "{currentExec.message}"
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {currentExec.name}
                </p>
                <p className="text-xs text-gray-500">{currentExec.title}</p>
              </div>
              {/* Navigation arrows */}
              {messagesToShow.length > 1 && (
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      setCurrentSlide(
                        (prev) =>
                          (prev - 1 + messagesToShow.length) %
                          messagesToShow.length
                      )
                    }
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      setCurrentSlide(
                        (prev) => (prev + 1) % messagesToShow.length
                      )
                    }
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Home() {
  const {
    recentNews,
    activeAlerts,
    safetyVideos,
    safetyTips,
    itTips,
    executiveMessages,
    companyImages,
    upcomingEvents,
  } = useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Build slides from company images (database or defaults)
  const companySlides = buildSlides(companyImages);

  // Build carousel items array - only items marked for slideshow by admin
  const carouselItems: CarouselItem[] = [
    // Add company values slides (Mission, Vision, Values) first
    ...companySlides.map(
      (slide): CarouselItem => ({ type: "company", data: slide })
    ),
    // Add safety videos marked for slideshow
    ...safetyVideos
      .filter((v) => v.videoUrl) // Must have video URL
      .map((video): CarouselItem => ({ type: "video", data: video })),
    // Add PDF documents (safety tips with documentUrl)
    ...safetyTips
      .filter((t) => t.documentUrl)
      .map((tip): CarouselItem => ({ type: "pdf", data: tip })),
    // Add safety tips with images (no PDF)
    ...safetyTips
      .filter((t) => t.featuredImage && !t.documentUrl)
      .map((tip): CarouselItem => ({ type: "tip", data: tip })),
    // Add featured news items with images (what admin marks as featured)
    ...recentNews
      .filter((n) => n.isFeatured && n.featuredImage)
      .slice(0, 5)
      .map((news): CarouselItem => ({ type: "news", data: news })),
    // Also add pinned news items with images (if not already featured)
    ...recentNews
      .filter((n) => n.isPinned && n.featuredImage && !n.isFeatured)
      .slice(0, 3)
      .map((news): CarouselItem => ({ type: "news", data: news })),
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [execSlide, setExecSlide] = useState(0);

  // Get current carousel item
  const currentItem = carouselItems[currentSlide];

  // Auto-rotate carousel (pause when video is playing)
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    // Don't auto-rotate if current slide is a video and it's playing
    if (currentItem?.type === "video" && isPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(timer);
  }, [carouselItems.length, currentItem?.type, isPlaying]);

  // Handle slide change - pause video when leaving video slide
  useEffect(() => {
    if (videoRef.current) {
      if (currentItem?.type === "video") {
        // Ensure muted for autoplay policy, then attempt autoplay
        videoRef.current.muted = true;
        setIsMuted(true);
        setIsPlaying(false);

        videoRef.current
          .play()
          .then(() => {
            // onPlay will also run, but keep state consistent if it doesn't
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay blocked: keep paused and show play button
            setIsPlaying(false);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [currentSlide, currentItem?.type]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    setIsPlaying(false);
  };
  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
    );
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Helper to get slide link
  const getSlideLink = (item: CarouselItem): string => {
    switch (item.type) {
      case "news":
        return `/news/${item.data.slug}`;
      case "video":
        return `/safety-videos`;
      case "tip":
        return `/safety-tips/${item.data.slug}`;
      case "pdf":
        return item.data.documentUrl; // Direct PDF link
      case "company":
        return `/policies`; // Link to policies page where full slideshow is
    }
  };

  // Helper to get slide badge info
  const getSlideBadge = (
    item: CarouselItem
  ): { label: string; color: string; icon: React.ReactNode } => {
    switch (item.type) {
      case "news":
        return {
          label: item.data.category.name,
          color: item.data.category.color,
          icon: null,
        };
      case "video":
        return {
          label: "Safety Video",
          color: "#dc2626", // red
          icon: <Video size={12} className="mr-1" />,
        };
      case "tip":
        return {
          label: "Safety Tip",
          color: "#16a34a", // green
          icon: <Lightbulb size={12} className="mr-1" />,
        };
      case "pdf":
        return {
          label: "Safety Document",
          color: "#2563eb", // blue
          icon: <FileText size={12} className="mr-1" />,
        };
      case "company":
        return {
          label: item.data.title,
          color: "#d2ab67", // brand gold
          icon: null,
        };
    }
  };

  return (
    <MainLayout showRightSidebar user={portalUser}>
      {/* Alert Toast Notifications - Auto-dismissing popups */}
      <AlertToast alerts={activeAlerts} autoHideDuration={8000} />

      {/* Featured Banner Carousel - Safety Videos, PDFs, Tips, and News */}
      {carouselItems.length > 0 && currentItem && (
        <Card className="mb-4 overflow-hidden shadow-lg sm:mb-6">
          <div className="relative h-[250px] bg-gray-900 sm:h-[400px] md:h-[500px] lg:h-[600px]">
            {/* Render based on item type */}
            {currentItem.type === "video" ? (
              <>
                {/* Safety Video with full playback controls */}
                <video
                  key={currentItem.data.id}
                  ref={videoRef}
                  src={
                    isCloudinaryUrl(currentItem.data.videoUrl)
                      ? getOptimizedVideoUrl(currentItem.data.videoUrl, {
                          quality: "auto",
                        })
                      : currentItem.data.videoUrl
                  }
                  poster={
                    currentItem.data.thumbnail
                      ? isCloudinaryUrl(currentItem.data.thumbnail)
                        ? getResponsiveUrl(
                            currentItem.data.thumbnail,
                            "hero",
                            "desktop"
                          )
                        : currentItem.data.thumbnail
                      : undefined
                  }
                  className="absolute inset-0 h-full w-full object-cover"
                  preload="metadata"
                  muted={isMuted}
                  playsInline
                  onClick={togglePlayPause}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    // Automatically move to next slide when video finishes
                    setIsPlaying(false);
                    if (carouselItems.length > 1) {
                      setCurrentSlide(
                        (prev) => (prev + 1) % carouselItems.length
                      );
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />

                {/* Gradient overlay for controls visibility */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />

                {/* Play/Pause Button - Center (shows when paused) */}
                {!isPlaying && (
                  <button
                    onClick={togglePlayPause}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 p-4 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/50 sm:p-6 md:p-8"
                    aria-label="Play video"
                  >
                    <Play size={32} fill="white" className="sm:hidden" />
                    <Play size={48} fill="white" className="hidden sm:block" />
                  </button>
                )}

                {/* Video Controls Bar - Bottom */}
                <div className="absolute right-2 bottom-16 left-2 flex items-center gap-2 sm:right-4 sm:bottom-24 sm:left-4 sm:gap-4">
                  <button
                    onClick={togglePlayPause}
                    className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 sm:p-3"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? (
                      <Pause size={18} className="sm:hidden" />
                    ) : (
                      <Play size={18} className="sm:hidden" />
                    )}
                    {isPlaying ? (
                      <Pause size={24} className="hidden sm:block" />
                    ) : (
                      <Play size={24} className="hidden sm:block" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 sm:p-3"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>

                  <span className="ml-auto text-sm text-white/80">
                    {isPlaying ? "Playing" : "Paused"} {isMuted && "• Muted"}
                  </span>
                </div>
              </>
            ) : currentItem.type === "pdf" ? (
              <>
                {/* PDF Document Display - fills entire card */}
                {currentItem.data.featuredImage ? (
                  <img
                    src={
                      isCloudinaryUrl(currentItem.data.featuredImage)
                        ? getResponsiveUrl(
                            currentItem.data.featuredImage,
                            "hero",
                            "desktop"
                          )
                        : currentItem.data.featuredImage
                    }
                    srcSet={
                      isCloudinaryUrl(currentItem.data.featuredImage)
                        ? generateSrcSet(currentItem.data.featuredImage, "hero")
                        : undefined
                    }
                    sizes={
                      isCloudinaryUrl(currentItem.data.featuredImage)
                        ? generateSizes("hero")
                        : undefined
                    }
                    alt={currentItem.data.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-950">
                    <div className="text-center">
                      <FileText
                        size={120}
                        className="mx-auto mb-4 text-white/30"
                      />
                      <p className="text-lg text-white/60">PDF Document</p>
                    </div>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />

                {/* Open PDF Button - Center */}
                <a
                  href={currentItem.data.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-full bg-blue-600 p-4 text-white transition-all hover:scale-110 hover:bg-blue-700 sm:gap-2 sm:p-6 md:p-8"
                >
                  <ExternalLink size={32} className="sm:hidden" />
                  <ExternalLink size={48} className="hidden sm:block" />
                  <span className="text-xs font-medium sm:text-sm">
                    Open PDF
                  </span>
                </a>
              </>
            ) : currentItem.type === "tip" ? (
              <>
                {/* Safety Tip with featured image - fills entire card */}
                <img
                  src={
                    isCloudinaryUrl(currentItem.data.featuredImage || "")
                      ? getResponsiveUrl(
                          currentItem.data.featuredImage || "",
                          "hero",
                          "desktop"
                        )
                      : currentItem.data.featuredImage || ""
                  }
                  srcSet={
                    isCloudinaryUrl(currentItem.data.featuredImage || "")
                      ? generateSrcSet(
                          currentItem.data.featuredImage || "",
                          "hero"
                        )
                      : undefined
                  }
                  sizes={
                    isCloudinaryUrl(currentItem.data.featuredImage || "")
                      ? generateSizes("hero")
                      : undefined
                  }
                  alt={currentItem.data.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
              </>
            ) : currentItem.type === "company" ? (
              <>
                {/* Company Values - Mission, Vision, Values - full image display */}
                <img
                  src={
                    isCloudinaryUrl(currentItem.data.image)
                      ? getResponsiveUrl(
                          currentItem.data.image,
                          "companyValues",
                          "desktop"
                        )
                      : currentItem.data.image
                  }
                  srcSet={
                    isCloudinaryUrl(currentItem.data.image)
                      ? generateSrcSet(currentItem.data.image, "companyValues")
                      : undefined
                  }
                  sizes={
                    isCloudinaryUrl(currentItem.data.image)
                      ? generateSizes("companyValues")
                      : undefined
                  }
                  alt={currentItem.data.alt}
                  className="absolute inset-0 h-full w-full bg-gray-900 bg-center object-fill xl:min-w-5xl"
                />
                {/* Minimal overlay to keep text readable without covering the branded image */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />
              </>
            ) : (
              <>
                {/* News item with featured image - fills entire card */}
                <img
                  src={
                    isCloudinaryUrl(currentItem.data.featuredImage || "")
                      ? getResponsiveUrl(
                          currentItem.data.featuredImage || "",
                          "hero",
                          "desktop"
                        )
                      : currentItem.data.featuredImage || ""
                  }
                  srcSet={
                    isCloudinaryUrl(currentItem.data.featuredImage || "")
                      ? generateSrcSet(
                          currentItem.data.featuredImage || "",
                          "hero"
                        )
                      : undefined
                  }
                  sizes={
                    isCloudinaryUrl(currentItem.data.featuredImage || "")
                      ? generateSizes("hero")
                      : undefined
                  }
                  alt={currentItem.data.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
              </>
            )}

            {/* Text content - positioned at bottom (minimal for company slides since image has text) */}
            {currentItem.type === "company" ? (
              <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-6">
                <Link
                  to="/policies"
                  className="bg-primary-600 hover:bg-primary-700 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors"
                >
                  View All Policies <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="absolute right-0 bottom-0 left-0 p-3 sm:p-6 md:p-8">
                <Chip
                  size="sm"
                  style={{ backgroundColor: getSlideBadge(currentItem).color }}
                  className="mb-1 font-medium text-white sm:mb-3"
                >
                  <span className="flex items-center">
                    {getSlideBadge(currentItem).icon}
                    {getSlideBadge(currentItem).label}
                  </span>
                </Chip>
                <h1 className="text-base leading-tight font-bold text-white drop-shadow-lg sm:text-2xl md:text-3xl lg:text-4xl">
                  {currentItem.data.title}
                </h1>
                <p className="mt-1 line-clamp-1 max-w-2xl text-xs text-white/90 drop-shadow sm:mt-2 sm:line-clamp-2 sm:text-sm md:text-base">
                  {currentItem.type === "news"
                    ? currentItem.data.excerpt || "Click to read more"
                    : currentItem.type === "video"
                      ? currentItem.data.description
                      : currentItem.type === "pdf"
                        ? currentItem.data.summary || "Click to view document"
                        : currentItem.data.summary || "Click to read more"}
                </p>
                {currentItem.type === "pdf" ? (
                  <a
                    href={currentItem.data.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 sm:mt-4 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    <FileText size={14} className="sm:hidden" />
                    <FileText size={16} className="hidden sm:block" /> View
                    Document <ExternalLink size={14} />
                  </a>
                ) : (
                  <Link
                    to={getSlideLink(currentItem)}
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:mt-4 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {currentItem.type === "video"
                      ? "View Details"
                      : "Read More"}{" "}
                    <ArrowRight size={14} className="sm:hidden" />
                    <ArrowRight size={16} className="hidden sm:block" />
                  </Link>
                )}
              </div>
            )}

            {/* Carousel Controls */}
            {carouselItems.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70 sm:left-4 sm:p-3"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} className="sm:hidden" />
                  <ChevronLeft size={28} className="hidden sm:block" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70 sm:right-4 sm:p-3"
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} className="sm:hidden" />
                  <ChevronRight size={28} className="hidden sm:block" />
                </button>

                {/* Slide Indicators with type colors */}
                <div className="absolute top-2 right-2 z-10 flex gap-1.5 sm:top-4 sm:right-4 sm:gap-2">
                  {carouselItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all sm:h-2.5 ${
                        idx === currentSlide
                          ? "w-6 bg-white sm:w-8"
                          : item.type === "video"
                            ? "w-2 bg-red-500/80 sm:w-2.5"
                            : item.type === "pdf"
                              ? "w-2 bg-blue-500/80 sm:w-2.5"
                              : item.type === "tip"
                                ? "w-2 bg-green-500/80 sm:w-2.5"
                                : item.type === "company"
                                  ? "bg-primary-500/80 w-2 sm:w-2.5"
                                  : "w-2 bg-white/50 sm:w-2.5"
                      }`}
                      aria-label={`Go to slide ${idx + 1} (${item.type})`}
                    />
                  ))}
                </div>

                {/* Slide Counter */}
                <Chip
                  size="sm"
                  variant="flat"
                  className="absolute top-2 left-2 z-10 bg-black/50 text-white sm:top-4 sm:left-4"
                >
                  {currentSlide + 1} / {carouselItems.length}
                </Chip>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Executive Messages Slideshow */}
      <ExecutiveMessagesCard
        messages={executiveMessages}
        currentSlide={execSlide}
        setCurrentSlide={setExecSlide}
      />

      {/* Upcoming Events & IT Tips - Side by Side */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary-100 flex h-9 w-9 items-center justify-center rounded-full">
                  <Calendar size={18} className="text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Events
                </h2>
              </div>
              <Button
                as={Link}
                to="/events"
                size="sm"
                variant="light"
                color="primary"
                endContent={<ArrowRight size={14} />}
              >
                All Events
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                const monthShort = eventDate.toLocaleDateString("en-US", {
                  month: "short",
                });
                const dayNum = eventDate.getDate();

                return (
                  <Link key={event.id} to={`/events/${event.slug}`}>
                    <Card className="group overflow-hidden shadow-sm transition-all hover:shadow-md">
                      <CardBody className="p-0">
                        <div className="flex">
                          {/* Featured Image or Date Fallback */}
                          {event.featuredImage ? (
                            <div className="relative h-auto w-40 flex-shrink-0 overflow-hidden">
                              <img
                                src={event.featuredImage}
                                alt={event.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {/* Date Badge Overlay */}
                              <div className="bg-primary-600/90 absolute top-2 left-2 flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5">
                                <span className="text-xs font-medium text-white">
                                  {monthShort}
                                </span>
                                <span className="text-xl leading-tight font-bold text-white">
                                  {dayNum}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="from-primary-500 to-primary-700 flex w-40 flex-shrink-0 flex-col items-center justify-center bg-gradient-to-b py-6 text-white">
                              <span className="text-sm font-medium tracking-wider uppercase opacity-90">
                                {monthShort}
                              </span>
                              <span className="text-4xl leading-none font-bold">
                                {dayNum}
                              </span>
                            </div>
                          )}

                          {/* Event Details */}
                          <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                            <h3 className="group-hover:text-primary-600 line-clamp-2 text-lg font-semibold text-gray-900 transition-colors">
                              {event.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {event.description}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                              {event.time && (
                                <span className="flex items-center gap-1.5">
                                  <Clock size={14} />
                                  {event.time}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5 truncate">
                                <MapPin size={14} className="flex-shrink-0" />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* IT Tips */}
        <div>
          <ITTipsSlideshow tips={itTips} />
        </div>
      </div>

      {/* News Posts Grid */}
      <div className="mb-8 lg:mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Latest News</h2>
          <Button
            as={Link}
            to="/news"
            size="sm"
            variant="light"
            color="primary"
            endContent={<ArrowRight size={14} />}
          >
            View All
          </Button>
        </div>

        {recentNews.length > 0 ? (
          <div className="flex flex-col gap-4">
            {/* All news cards - consistent full-width layout */}
            {recentNews.map((post, index) => (
              <Link key={post.id} to={`/news/${post.slug}`}>
                <Card className="group overflow-hidden p-0 shadow-sm transition-shadow hover:shadow-md md:h-52">
                  <CardBody className="h-full p-0">
                    <div className="flex flex-col gap-3 md:flex-row md:gap-6">
                      {/* Image Section */}
                      {/* <div className="relative"> */}
                      <div className="h-52 w-full flex-shrink-0 overflow-hidden md:h-52 md:w-64">
                        <img
                          src={
                            post.featuredImage ||
                            "https://via.placeholder.com/800x450?text=ARL+News"
                          }
                          alt={post.title}
                          className="h-52 w-full object-cover object-center transition-transform group-hover:scale-105 md:h-52 md:w-64"
                        />
                      </div>
                      {/* Category badge on image */}
                      <div className="flex flex-1 flex-col justify-between px-5 py-4">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={"warning"}
                          // style={{ backgroundColor: post.category.color }}
                          className="font-medium text-white"
                        >
                          {post.category.name}
                        </Chip>
                        <div>
                          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-gray-900 sm:text-lg">
                            {post.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                            {post.excerpt || "Click to read more..."}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            color="warning"
                            as={Link}
                            href={`/news/${post.slug}`}
                          >
                            Read More
                          </Button>
                        </div>
                      </div>
                      {/* </div> */}
                      {/* Content Section */}
                      {/* <CardBody className="p-4 sm:w-3/5 bg-white flex flex-col justify-center"> */}
                      {/* <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <ThumbsUp size={14} />
                            Like
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Share2 size={14} />
                            Share
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-sm text-primary-600 font-medium">
                          Read <ArrowRight size={14} />
                        </span>
                      </div> */}
                      {/* </CardBody> */}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="py-12 text-center">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No news articles yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Check back later for updates
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
