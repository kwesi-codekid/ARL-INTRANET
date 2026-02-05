import { Card, CardBody, CardHeader, Button, Input, Chip, Image } from "@heroui/react";
import {
  Shield,
  Phone,
  Search,
  ArrowRight,
  Lightbulb,
  Video,
  UtensilsCrossed,
  AppWindow,
  Play,
  Clock,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Form, Link, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import type { SerializedToolboxTalk } from "~/lib/services/toolbox-talk.server";
import type { SerializedSafetyTip, SerializedSafetyVideo } from "~/lib/services/safety.server";
import type { SerializedMenu, MealType } from "~/lib/utils/menu-constants";
import { dietaryInfo, mealTimeInfo } from "~/lib/utils/menu-constants";

interface QuickLink {
  _id: string;
  name: string;
  url: string;
  icon?: string;
  iconType?: "url" | "lucide" | "emoji";
  isInternal?: boolean;
}

interface WeeklyTalkData {
  talk: SerializedToolboxTalk | null;
  weekRange: { start: string; end: string };
}

interface SafetyTipData {
  tip: SerializedSafetyTip | null;
}

interface SafetyVideoData {
  video: SerializedSafetyVideo | null;
}

interface MenuData {
  menu: SerializedMenu | null;
}

export function MobileSidebarContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const quickLinksFetcher = useFetcher<{ quickLinks: QuickLink[] }>();
  const toolboxTalkFetcher = useFetcher<WeeklyTalkData>();
  const safetyTipFetcher = useFetcher<SafetyTipData>();
  const safetyVideoFetcher = useFetcher<SafetyVideoData>();
  const menuFetcher = useFetcher<MenuData>();

  useEffect(() => {
    quickLinksFetcher.load("/api/quick-links");
    toolboxTalkFetcher.load("/api/toolbox-talk-weekly");
    safetyTipFetcher.load("/api/safety-tips?today=true");
    safetyVideoFetcher.load("/api/safety-videos?featured=true");
    menuFetcher.load("/api/menu?mode=today");
  }, []);

  const quickLinks = quickLinksFetcher.data?.quickLinks || [];
  const weeklyTalk = toolboxTalkFetcher.data?.talk || null;
  const safetyTip = safetyTipFetcher.data?.tip || null;
  const safetyVideo = safetyVideoFetcher.data?.video || null;
  const todayMenu = menuFetcher.data?.menu || null;

  const getCurrentMealType = (): MealType => {
    const currentHour = new Date().getHours();
    if (currentHour >= 15) return "dinner";
    if (currentHour >= 11) return "lunch";
    return "breakfast";
  };

  const currentMealType = getCurrentMealType();
  const currentMeal = todayMenu?.meals.find((m) => m.type === currentMealType);

  const formatDuration = (seconds: number): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-8 space-y-4 lg:hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Quick Access
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Two-column grid for smaller widgets */}
      <div className="grid grid-cols-2 gap-3">
        {/* Directory Search */}
        <Card className="shadow-sm">
          <CardBody className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <Phone size={14} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-gray-900">Directory</span>
            </div>
            <Form method="get" action="/directory">
              <Input
                name="search"
                placeholder="Search..."
                size="sm"
                startContent={<Search size={12} className="text-gray-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                classNames={{
                  inputWrapper: "bg-gray-50 h-8",
                  input: "text-xs",
                }}
              />
            </Form>
          </CardBody>
        </Card>

        {/* Today's Menu */}
        <Card className="shadow-sm">
          <CardBody className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                  <UtensilsCrossed size={14} className="text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-gray-900">Menu</span>
              </div>
              <Chip size="sm" color="warning" variant="flat" className="text-[10px] h-5">
                {mealTimeInfo[currentMealType].label}
              </Chip>
            </div>
            {currentMeal ? (
              <ul className="space-y-0.5">
                {currentMeal.items
                  .filter((item) => item.isAvailable)
                  .slice(0, 2)
                  .map((item, index) => (
                    <li key={index} className="flex items-center gap-1 text-[10px] text-gray-600">
                      <span className="text-orange-500">•</span>
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-[10px] text-gray-500">No menu today</p>
            )}
            <Link
              to="/canteen"
              className="mt-1 flex items-center gap-1 text-[10px] text-primary-600 hover:underline"
            >
              Full menu <ArrowRight size={10} />
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Weekly Toolbox Talk - Full width */}
      {weeklyTalk && (
        <Card className="shadow-sm">
          <CardBody className="p-3">
            <div className="flex gap-3">
              {weeklyTalk.featuredMedia?.url && (
                <Link to={`/toolbox-talk/${weeklyTalk.slug}`} className="shrink-0">
                  <div className="relative h-20 w-28 overflow-hidden rounded-lg">
                    {weeklyTalk.featuredMedia.type === "pdf" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                        <FileText size={24} className="text-green-600 mb-1" />
                        <span className="text-[10px] font-medium text-green-700">PDF</span>
                      </div>
                    ) : (
                      <Image
                        src={weeklyTalk.featuredMedia.thumbnail || weeklyTalk.featuredMedia.url}
                        alt={weeklyTalk.title}
                        className="h-full w-full object-cover"
                        classNames={{ wrapper: "h-full w-full" }}
                      />
                    )}
                  </div>
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <Shield size={14} className="text-green-600" />
                  <span className="text-xs font-semibold text-gray-900">This Week's Talk</span>
                  <Chip size="sm" color="success" variant="flat" className="text-[10px] h-5">
                    Active
                  </Chip>
                </div>
                <Link
                  to={`/toolbox-talk/${weeklyTalk.slug}`}
                  className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                >
                  {weeklyTalk.title}
                </Link>
                <Button
                  as={Link}
                  to={`/toolbox-talk/${weeklyTalk.slug}`}
                  color="success"
                  variant="flat"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                  endContent={<ArrowRight size={12} />}
                >
                  {weeklyTalk.featuredMedia?.type === "pdf" ? "View PDF" : "Read Talk"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Safety Tip & Video Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Safety Tip */}
        {safetyTip && (
          <Card className="shadow-sm">
            <CardBody className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                  <Lightbulb size={14} className="text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-gray-900">Safety Tip</span>
              </div>
              <Link
                to={`/safety-tips/${safetyTip.slug}`}
                className="text-xs font-medium text-gray-900 hover:text-emerald-600 line-clamp-2"
              >
                {safetyTip.title}
              </Link>
              <Link
                to={`/safety-tips/${safetyTip.slug}`}
                className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 hover:underline"
              >
                Read tip <ArrowRight size={10} />
              </Link>
            </CardBody>
          </Card>
        )}

        {/* Safety Video */}
        {safetyVideo && (
          <Card className="shadow-sm">
            <CardBody className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                  <Video size={14} className="text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-gray-900">Safety Video</span>
              </div>
              <Link to={`/safety-videos?play=${safetyVideo.id}`} className="block">
                <div className="relative h-16 w-full overflow-hidden rounded-lg bg-gray-100">
                  {safetyVideo.thumbnail ? (
                    <img
                      src={safetyVideo.thumbnail}
                      alt={safetyVideo.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                      <Video size={16} className="text-blue-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                      <Play size={14} className="text-blue-600 ml-0.5" />
                    </div>
                  </div>
                  {safetyVideo.duration > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded flex items-center gap-0.5">
                      <Clock size={8} />
                      {formatDuration(safetyVideo.duration)}
                    </div>
                  )}
                </div>
              </Link>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Quick Links / Apps */}
      {quickLinks.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">
                <AppWindow size={14} className="text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-gray-900">Quick Apps</span>
            </div>
          </CardHeader>
          <CardBody className="pt-0 px-3 pb-3">
            <div className="grid grid-cols-4 gap-2">
              {quickLinks.slice(0, 8).map((link) => (
                <a
                  key={link._id}
                  href={link.url}
                  target={link.isInternal ? "_self" : "_blank"}
                  rel={link.isInternal ? undefined : "noopener noreferrer"}
                  className="flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors hover:bg-gray-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm">
                    {link.iconType === "emoji" && link.icon ? (
                      link.icon
                    ) : link.iconType === "url" && link.icon ? (
                      <img src={link.icon} alt="" className="h-5 w-5" />
                    ) : (
                      <AppWindow size={16} className="text-gray-500" />
                    )}
                  </span>
                  <span className="text-[10px] text-gray-700 line-clamp-1">{link.name}</span>
                </a>
              ))}
            </div>
            <Link
              to="/apps"
              className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-primary-600"
            >
              <span>View all apps</span>
              <ExternalLink size={12} />
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
