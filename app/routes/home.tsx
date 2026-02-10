import type { SerializedSafetyVideo, SerializedSafetyTip } from "~/lib/services/safety.server";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Chip,
  Avatar,
  Image,
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
import { getResponsiveUrl, generateSrcSet, generateSizes, getOptimizedVideoUrl, isCloudinaryUrl } from "~/components/ui";








import { buildSlides } from "~/components/dashboard";
import type { CompanyImages } from "~/components/dashboard";

// Loader for homepage data
export async function loader({ request }: LoaderFunctionArgs) {
  const { getSafetyVideos, getSafetyTips, serializeSafetyVideo, serializeSafetyTip } = await import("~/lib/services/safety.server");
  const { getActiveITTips } = await import("~/lib/services/it-tip.server");
  const { getActiveExecutiveMessages } = await import("~/lib/services/executive-message.server");
  const { getCompanyImages } = await import("~/lib/services/company-info.server");
  const { getUpcomingEvents, serializeEvent } = await import("~/lib/services/event.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");
  const { Alert } = await import("~/lib/db/models/alert.server");

  await connectDB();

  const [recentNews, featuredNews, activeAlerts, safetyVideosResult, safetyTipsResult, itTips, executiveMessages, companyImages, upcomingEvents] = await Promise.all([
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
    category: news.category ? {
      name: (news.category as { name?: string }).name || "General",
      color: (news.category as { color?: string }).color || "#D4AF37",
    } : { name: "General", color: "#D4AF37" },
    author: news.author ? {
      name: (news.author as { name?: string }).name || "Admin",
    } : { name: "Admin" },
    publishedAt: news.publishedAt?.toISOString() || news.createdAt.toISOString(),
    isPinned: news.isPinned,
    isFeatured: news.isFeatured || false,
  });

  // Merge featured news into recent news, avoiding duplicates
  const recentNewsIds = new Set(recentNews.map((n) => n._id.toString()));
  const extraFeatured = featuredNews.filter((n) => !recentNewsIds.has(n._id.toString()));
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
  | { type: "company"; data: { id: string; title: string; image: string; alt: string } }; // Company values slides

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
function ITTipsSlideshow({
  tips,
}: {
  tips: LoaderData["itTips"];
}) {
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

  const categoryColors: Record<string, { bg: string; text: string; gradient: string }> = {
    security: { bg: "bg-red-100", text: "text-red-600", gradient: "from-red-500 to-rose-500" },
    productivity: { bg: "bg-green-100", text: "text-green-600", gradient: "from-green-500 to-emerald-500" },
    shortcuts: { bg: "bg-blue-100", text: "text-blue-600", gradient: "from-blue-500 to-indigo-500" },
    software: { bg: "bg-purple-100", text: "text-purple-600", gradient: "from-purple-500 to-violet-500" },
    hardware: { bg: "bg-orange-100", text: "text-orange-600", gradient: "from-orange-500 to-amber-500" },
    general: { bg: "bg-gray-100", text: "text-gray-600", gradient: "from-gray-500 to-slate-500" },
  };

  if (tips.length === 0) {
    return (
      <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardBody className="flex flex-col items-center justify-center py-8">
          <Lightbulb size={36} className="text-gray-300 mb-2" />
          <p className="text-gray-500 font-medium">No IT Tips Available</p>
          <p className="text-sm text-gray-400">Check back later for helpful tips</p>
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
    <Card className="shadow-sm overflow-hidden">
      <div className="flex flex-col">
        {/* Header with gradient based on category */}
        <div className={`bg-gradient-to-r ${colors.gradient} p-5 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <TipIcon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">IT Tip of the Moment</h3>
                <p className="text-white/80 text-sm capitalize">{tip.category}</p>
              </div>
            </div>
            {tip.isPinned && (
              <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                <Pin size={10} />
                <span>Pinned</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <CardBody className={`p-5 bg-gradient-to-br ${colors.bg} to-white`}>
          <div className="mb-3">
            <h4 className={`text-xl font-extrabold ${colors.text} mb-1`}>{tip.title}</h4>
            <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${colors.gradient}`} />
          </div>
          <div className={`p-4 rounded-xl bg-white shadow-sm border-l-4 ${colors.text.replace('text-', 'border-')}`}>
            <p className="text-lg font-semibold text-gray-800 leading-relaxed">
              {tip.content}
            </p>
          </div>
        </CardBody>

        {/* Navigation Footer */}
        {tips.length > 1 && (
          <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between">
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
                    backgroundColor: idx === safeTipIndex ? (colors.gradient.includes("blue") ? "#3b82f6" : undefined) : undefined,
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
                onPress={() => setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length)}
                aria-label="Previous tip"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setCurrentTip((prev) => (prev + 1) % tips.length)}
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
    }, 8000); // 8 seconds per slide
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
          <div className="sm:w-48 md:w-56 flex-shrink-0 relative">
            <img
              src={currentExec.photo}
              alt={currentExec.name}
              className="w-full h-48 sm:h-full object-cover object-top"
            />
            {/* Slide indicators on image */}
            {messagesToShow.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
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
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center bg-gradient-to-r from-gray-50 to-white relative">
            <p className="text-primary-600 text-xs font-semibold uppercase tracking-wider mb-1">
              Message from Leadership
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Welcome to ARL Intranet
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              "{currentExec.message}"
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{currentExec.name}</p>
                <p className="text-xs text-gray-500">{currentExec.title}</p>
              </div>
              {/* Navigation arrows */}
              {messagesToShow.length > 1 && (
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setCurrentSlide((prev) => (prev - 1 + messagesToShow.length) % messagesToShow.length)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setCurrentSlide((prev) => (prev + 1) % messagesToShow.length)}
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
  const { recentNews, activeAlerts, safetyVideos, safetyTips, itTips, executiveMessages, companyImages, upcomingEvents } = useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Build slides from company images (database or defaults)
  const companySlides = buildSlides(companyImages);

  // Build carousel items array - only items marked for slideshow by admin
  const carouselItems: CarouselItem[] = [
    // Add company values slides (Mission, Vision, Values) first
    ...companySlides.map((slide): CarouselItem => ({ type: "company", data: slide })),
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
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
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
      case "news": return `/news/${item.data.slug}`;
      case "video": return `/safety-videos`;
      case "tip": return `/safety-tips/${item.data.slug}`;
      case "pdf": return item.data.documentUrl; // Direct PDF link
      case "company": return `/policies`; // Link to policies page where full slideshow is
    }
  };

  // Helper to get slide badge info
  const getSlideBadge = (item: CarouselItem): { label: string; color: string; icon: React.ReactNode } => {
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
        <Card className="mb-4 sm:mb-6 overflow-hidden shadow-lg">
          <div className="relative h-[250px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gray-900">
            {/* Render based on item type */}
            {currentItem.type === "video" ? (
              <>
                {/* Safety Video with full playback controls */}
                <video
                  key={currentItem.data.id}
                  ref={videoRef}
                  src={isCloudinaryUrl(currentItem.data.videoUrl) ? getOptimizedVideoUrl(currentItem.data.videoUrl, { quality: "auto" }) : currentItem.data.videoUrl}
                  poster={currentItem.data.thumbnail ? (isCloudinaryUrl(currentItem.data.thumbnail) ? getResponsiveUrl(currentItem.data.thumbnail, "hero", "desktop") : currentItem.data.thumbnail) : undefined}
                  className="absolute inset-0 w-full h-full object-cover"
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
                      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                />

                {/* Gradient overlay for controls visibility */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                {/* Play/Pause Button - Center (shows when paused) */}
                {!isPlaying && (
                  <button
                    onClick={togglePlayPause}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 hover:bg-white/50 p-4 sm:p-6 md:p-8 text-white transition-all backdrop-blur-sm hover:scale-110"
                    aria-label="Play video"
                  >
                    <Play size={32} fill="white" className="sm:hidden" />
                    <Play size={48} fill="white" className="hidden sm:block" />
                  </button>
                )}

                {/* Video Controls Bar - Bottom */}
                <div className="absolute bottom-16 sm:bottom-24 left-2 sm:left-4 right-2 sm:right-4 flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={togglePlayPause}
                    className="rounded-full bg-black/50 hover:bg-black/70 p-2 sm:p-3 text-white transition-colors"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? <Pause size={18} className="sm:hidden" /> : <Play size={18} className="sm:hidden" />}
                    {isPlaying ? <Pause size={24} className="hidden sm:block" /> : <Play size={24} className="hidden sm:block" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="rounded-full bg-black/50 hover:bg-black/70 p-2 sm:p-3 text-white transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>

                  <span className="text-white/80 text-sm ml-auto">
                    {isPlaying ? "Playing" : "Paused"} {isMuted && "• Muted"}
                  </span>
                </div>
              </>
            ) : currentItem.type === "pdf" ? (
              <>
                {/* PDF Document Display - fills entire card */}
                {currentItem.data.featuredImage ? (
                  <img
                    src={isCloudinaryUrl(currentItem.data.featuredImage) ? getResponsiveUrl(currentItem.data.featuredImage, "hero", "desktop") : currentItem.data.featuredImage}
                    srcSet={isCloudinaryUrl(currentItem.data.featuredImage) ? generateSrcSet(currentItem.data.featuredImage, "hero") : undefined}
                    sizes={isCloudinaryUrl(currentItem.data.featuredImage) ? generateSizes("hero") : undefined}
                    alt={currentItem.data.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-950">
                    <div className="text-center">
                      <FileText size={120} className="mx-auto text-white/30 mb-4" />
                      <p className="text-white/60 text-lg">PDF Document</p>
                    </div>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                {/* Open PDF Button - Center */}
                <a
                  href={currentItem.data.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 hover:bg-blue-700 p-4 sm:p-6 md:p-8 text-white transition-all hover:scale-110 flex flex-col items-center gap-1 sm:gap-2"
                >
                  <ExternalLink size={32} className="sm:hidden" />
                  <ExternalLink size={48} className="hidden sm:block" />
                  <span className="text-xs sm:text-sm font-medium">Open PDF</span>
                </a>
              </>
            ) : currentItem.type === "tip" ? (
              <>
                {/* Safety Tip with featured image - fills entire card */}
                <img
                  src={isCloudinaryUrl(currentItem.data.featuredImage || "") ? getResponsiveUrl(currentItem.data.featuredImage || "", "hero", "desktop") : currentItem.data.featuredImage || ""}
                  srcSet={isCloudinaryUrl(currentItem.data.featuredImage || "") ? generateSrcSet(currentItem.data.featuredImage || "", "hero") : undefined}
                  sizes={isCloudinaryUrl(currentItem.data.featuredImage || "") ? generateSizes("hero") : undefined}
                  alt={currentItem.data.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              </>
            ) : currentItem.type === "company" ? (
              <>
                {/* Company Values - Mission, Vision, Values - full image display */}
                <img
                  src={isCloudinaryUrl(currentItem.data.image) ? getResponsiveUrl(currentItem.data.image, "companyValues", "desktop") : currentItem.data.image}
                  srcSet={isCloudinaryUrl(currentItem.data.image) ? generateSrcSet(currentItem.data.image, "companyValues") : undefined}
                  sizes={isCloudinaryUrl(currentItem.data.image) ? generateSizes("companyValues") : undefined}
                  alt={currentItem.data.alt}
                  className="absolute inset-0 w-full h-full object-contain sm:object-cover bg-gray-900"
                />
                {/* Minimal overlay to keep text readable without covering the branded image */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
              </>
            ) : (
              <>
                {/* News item with featured image - fills entire card */}
                <img
                  src={isCloudinaryUrl(currentItem.data.featuredImage || "") ? getResponsiveUrl(currentItem.data.featuredImage || "", "hero", "desktop") : currentItem.data.featuredImage || ""}
                  srcSet={isCloudinaryUrl(currentItem.data.featuredImage || "") ? generateSrcSet(currentItem.data.featuredImage || "", "hero") : undefined}
                  sizes={isCloudinaryUrl(currentItem.data.featuredImage || "") ? generateSizes("hero") : undefined}
                  alt={currentItem.data.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              </>
            )}

            {/* Text content - positioned at bottom (minimal for company slides since image has text) */}
            {currentItem.type === "company" ? (
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <Link
                  to="/policies"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-full transition-colors"
                >
                  View All Policies <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-8">
                <Chip
                  size="sm"
                  style={{ backgroundColor: getSlideBadge(currentItem).color }}
                  className="mb-1 sm:mb-3 text-white font-medium"
                >
                  <span className="flex items-center">
                    {getSlideBadge(currentItem).icon}
                    {getSlideBadge(currentItem).label}
                  </span>
                </Chip>
                <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg leading-tight">
                  {currentItem.data.title}
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-white/90 line-clamp-1 sm:line-clamp-2 max-w-2xl drop-shadow">
                  {currentItem.type === "news" ? (currentItem.data.excerpt || "Click to read more") :
                   currentItem.type === "video" ? currentItem.data.description :
                   currentItem.type === "pdf" ? (currentItem.data.summary || "Click to view document") :
                   (currentItem.data.summary || "Click to read more")}
                </p>
                {currentItem.type === "pdf" ? (
                  <a
                    href={currentItem.data.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 sm:mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors"
                  >
                    <FileText size={14} className="sm:hidden" /><FileText size={16} className="hidden sm:block" /> View Document <ExternalLink size={14} />
                  </a>
                ) : (
                  <Link
                    to={getSlideLink(currentItem)}
                    className="mt-2 sm:mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors backdrop-blur-sm"
                  >
                    {currentItem.type === "video" ? "View Details" : "Read More"} <ArrowRight size={14} className="sm:hidden" /><ArrowRight size={16} className="hidden sm:block" />
                  </Link>
                )}
              </div>
            )}

            {/* Carousel Controls */}
            {carouselItems.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 p-1.5 sm:p-3 text-white transition-colors z-10"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} className="sm:hidden" />
                  <ChevronLeft size={28} className="hidden sm:block" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 hover:bg-black/70 p-1.5 sm:p-3 text-white transition-colors z-10"
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} className="sm:hidden" />
                  <ChevronRight size={28} className="hidden sm:block" />
                </button>

                {/* Slide Indicators with type colors */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
                  {carouselItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 sm:h-2.5 rounded-full transition-all ${
                        idx === currentSlide
                          ? "w-6 sm:w-8 bg-white"
                          : item.type === "video"
                            ? "w-2 sm:w-2.5 bg-red-500/80"
                            : item.type === "pdf"
                              ? "w-2 sm:w-2.5 bg-blue-500/80"
                              : item.type === "tip"
                                ? "w-2 sm:w-2.5 bg-green-500/80"
                                : item.type === "company"
                                  ? "w-2 sm:w-2.5 bg-primary-500/80"
                                  : "w-2 sm:w-2.5 bg-white/50"
                      }`}
                      aria-label={`Go to slide ${idx + 1} (${item.type})`}
                    />
                  ))}
                </div>

                {/* Slide Counter */}
                <Chip
                  size="sm"
                  variant="flat"
                  className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 text-white z-10"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
                  <Calendar size={18} className="text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
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
                const monthShort = eventDate.toLocaleDateString("en-US", { month: "short" });
                const dayNum = eventDate.getDate();

                return (
                  <Link key={event.id} to={`/events/${event.slug}`}>
                    <Card className="shadow-sm hover:shadow-md transition-all group overflow-hidden">
                      <CardBody className="p-0">
                        <div className="flex">
                          {/* Featured Image or Date Fallback */}
                          {event.featuredImage ? (
                            <div className="relative h-auto w-40 flex-shrink-0 overflow-hidden">
                              <img
                                src={event.featuredImage}
                                alt={event.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {/* Date Badge Overlay */}
                              <div className="absolute top-2 left-2 flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 bg-primary-600/90">
                                <span className="text-xs font-medium text-white">{monthShort}</span>
                                <span className="text-xl leading-tight font-bold text-white">{dayNum}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-40 bg-gradient-to-b from-primary-500 to-primary-700 flex flex-col items-center justify-center py-6 text-white">
                              <span className="text-sm font-medium uppercase tracking-wider opacity-90">{monthShort}</span>
                              <span className="text-4xl font-bold leading-none">{dayNum}</span>
                            </div>
                          )}

                          {/* Event Details */}
                          <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                              {event.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              {event.time && (
                                <span className="flex items-center gap-1.5">
                                  <Clock size={14} />
                                  {event.time}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5 truncate">
                                <MapPin size={14} className="flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
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
        <div className="flex items-center justify-between mb-4">
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
                <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden group md:h-52 p-0">
                  <CardBody className="p-0 h-full">
                  <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                    {/* Image Section */}
                    {/* <div className="relative"> */}
                    <div className="md:h-52 md:w-64 w-full h-52 overflow-hidden flex-shrink-0">

                      <Image
                        src={post.featuredImage || "https://via.placeholder.com/800x450?text=ARL+News"}
                        alt={post.title}
                        classNames={{
                          img: "md:h-52 md:w-64 w-full h-52 object-cover object-center group-hover:scale-105 transition-transform",
                        }}
                        radius="none"
                      />
                    </div>
                      {/* Category badge on image */}
                      <div className="flex-1 py-4 px-5 flex flex-col justify-between">
                        <Chip
                          size="sm"
                          variant="flat"
                          // color={post.category.color}
                          style={{ backgroundColor: post.category.color }}
                          className="text-white font-medium"
                        >
                          {post.category.name}
                        </Chip>
                        <div>

                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 mt-3">{post.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{post.excerpt || "Click to read more..."}</p>
                        </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar
                          name={getInitials(post.author.name)}
                          size="sm"
                          classNames={{
                            base: "bg-primary-500 text-white font-semibold text-xs",
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(post.publishedAt)}
                          </p>
                        </div>
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
