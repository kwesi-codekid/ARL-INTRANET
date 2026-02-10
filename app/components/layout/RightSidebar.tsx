import { Card, CardBody, CardHeader, Button, Input, Chip, Image } from "@heroui/react";
import { Shield, Star, ExternalLink, Search, AppWindow, Phone, ArrowRight, Calendar, PlayCircle, Volume2, Lightbulb, Video, UtensilsCrossed, Coffee, Sun, Moon, Clock, Play, FileText, Eye } from "lucide-react";
import { Form, Link, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import type { SerializedToolboxTalk } from "~/lib/services/toolbox-talk.server";
import type { SerializedSafetyTip, SerializedSafetyVideo } from "~/lib/services/safety.server";
import type { SerializedMenu, MealType } from "~/lib/utils/menu-constants";
import { dietaryInfo, mealTimeInfo } from "~/lib/utils/menu-constants";

interface FeaturedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  views: number;
  isFeatured: boolean;
  category: { name: string; color: string } | null;
  author: string;
}

interface FeaturedNewsData {
  posts: FeaturedPost[];
}

interface QuickLink {
  _id: string;
  name: string;
  url: string;
  icon?: string;
  iconType?: "url" | "lucide" | "emoji";
  isInternal?: boolean;
  clicks: number;
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

export function RightSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const quickLinksFetcher = useFetcher<{ quickLinks: QuickLink[] }>();
  const toolboxTalkFetcher = useFetcher<WeeklyTalkData>();
  const safetyTipFetcher = useFetcher<SafetyTipData>();
  const safetyVideoFetcher = useFetcher<SafetyVideoData>();
  const menuFetcher = useFetcher<MenuData>();
  const featuredNewsFetcher = useFetcher<FeaturedNewsData>();

  // Fetch data on mount
  useEffect(() => {
    quickLinksFetcher.load("/api/quick-links");
    toolboxTalkFetcher.load("/api/toolbox-talk-weekly");
    safetyTipFetcher.load("/api/safety-tips?today=true");
    safetyVideoFetcher.load("/api/safety-videos?featured=true");
    menuFetcher.load("/api/menu?mode=today");
    featuredNewsFetcher.load("/api/featured-news?limit=5");
  }, []);

  const quickLinks = quickLinksFetcher.data?.quickLinks || [];
  const weeklyTalk = toolboxTalkFetcher.data?.talk || null;
  const weekRange = toolboxTalkFetcher.data?.weekRange;
  const safetyTip = safetyTipFetcher.data?.tip || null;
  const safetyVideo = safetyVideoFetcher.data?.video || null;
  const todayMenu = menuFetcher.data?.menu || null;
  const featuredPosts = featuredNewsFetcher.data?.posts || [];

  // Get current meal based on time
  const getCurrentMealType = (): MealType => {
    const currentHour = new Date().getHours();
    if (currentHour >= 15) return "dinner";
    if (currentHour >= 11) return "lunch";
    return "breakfast";
  };

  const currentMealType = getCurrentMealType();
  const currentMeal = todayMenu?.meals.find((m) => m.type === currentMealType);

  // Format video duration
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format week range for display
  const formatWeekRange = () => {
    if (!weekRange) return "Weekly safety briefing";
    const startDate = new Date(weekRange.start);
    const endDate = new Date(weekRange.end);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  return (
    <aside className="sticky top-20 hidden w-72 shrink-0 self-start max-h-[calc(100vh-6rem)] overflow-y-auto lg:block">
      {/* Directory Quick Search Widget - Task: 1.1.4.2.8 */}
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Phone size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Directory Search</h3>
              <p className="text-xs text-gray-500">Find contacts quickly</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <Form method="get" action="/directory">
            <Input
              name="search"
              placeholder="Name, dept, or ext..."
              size="sm"
              startContent={<Search size={14} className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              classNames={{
                inputWrapper: "bg-gray-50",
              }}
            />
            <Button
              type="submit"
              size="sm"
              color="primary"
              variant="flat"
              className="mt-2 w-full"
              isDisabled={!searchQuery.trim()}
              endContent={<ArrowRight size={14} />}
            >
              Search Directory
            </Button>
          </Form>
          <Link
            to="/directory"
            className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-primary-600"
          >
            <span>Browse full directory</span>
            <ExternalLink size={12} />
          </Link>
        </CardBody>
      </Card>

      {/* Apps Widget */}
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <AppWindow size={16} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Apps</h3>
              <p className="text-xs text-gray-500">Frequently used apps</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {quickLinksFetcher.state === "loading" ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : quickLinks.length > 0 ? (
            <div className="space-y-1">
              {quickLinks.map((link) => (
                <a
                  key={link._id}
                  href={link.url}
                  target={link.isInternal ? "_self" : "_blank"}
                  rel={link.isInternal ? undefined : "noopener noreferrer"}
                  className="flex items-center gap-2 rounded-lg p-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 text-xs">
                    {link.iconType === "emoji" && link.icon ? (
                      link.icon
                    ) : link.iconType === "url" && link.icon ? (
                      <img src={link.icon} alt="" className="h-4 w-4" />
                    ) : (
                      <AppWindow size={12} className="text-gray-500" />
                    )}
                  </span>
                  <span className="truncate">{link.name}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-500">No apps available</p>
          )}
          <Link
            to="/apps"
            className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-primary-600"
          >
            <span>View all apps</span>
            <ExternalLink size={12} />
          </Link>
        </CardBody>
      </Card>

      {/* Weekly PSI Talk */}
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <Shield size={16} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">This Week's PSI Talk</h3>
                {weeklyTalk && (
                  <Chip size="sm" color="success" variant="flat" className="text-xs">
                    Active
                  </Chip>
                )}
              </div>
              <p className="text-xs text-gray-500">{formatWeekRange()}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {toolboxTalkFetcher.state === "loading" ? (
            <div className="space-y-2">
              <div className="h-20 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100 w-3/4" />
            </div>
          ) : weeklyTalk ? (
            <div className="space-y-3">
              {/* Thumbnail or PDF indicator */}
              {weeklyTalk.featuredMedia?.url && (
                <Link to={`/toolbox-talk/${weeklyTalk.slug}`} className="block">
                  <div className="relative h-28 w-full overflow-hidden rounded-lg">
                    {weeklyTalk.featuredMedia.type === "pdf" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                        <FileText size={32} className="text-green-600 mb-1" />
                        <span className="text-xs font-medium text-green-700">PDF Document</span>
                        <span className="text-[10px] text-green-600 mt-1">Tap to view</span>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={weeklyTalk.featuredMedia.thumbnail || weeklyTalk.featuredMedia.url}
                          alt={weeklyTalk.title}
                          className="h-full w-full object-cover"
                          classNames={{ wrapper: "h-full w-full" }}
                        />
                        {(weeklyTalk.featuredMedia.type === "video" || weeklyTalk.featuredMedia.type === "audio") && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                              {weeklyTalk.featuredMedia.type === "video" ? (
                                <PlayCircle size={20} className="text-green-600" />
                              ) : (
                                <Volume2 size={20} className="text-green-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              )}

              {/* Title & Summary */}
              <div>
                <Link
                  to={`/toolbox-talk/${weeklyTalk.slug}`}
                  className="text-sm font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
                >
                  {weeklyTalk.title}
                </Link>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{weeklyTalk.summary}</p>
              </div>

              {/* Tags */}
              {weeklyTalk.tags && weeklyTalk.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {weeklyTalk.tags.slice(0, 2).map((tag) => (
                    <Chip key={tag} size="sm" variant="flat" color="warning" className="text-xs">
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}

              <Button
                as={Link}
                to={`/toolbox-talk/${weeklyTalk.slug}`}
                color="success"
                variant="flat"
                size="sm"
                className="w-full"
                endContent={<ArrowRight size={14} />}
              >
                Read Talk
              </Button>
            </div>
          ) : (
            <div className="text-center py-3">
              <Calendar size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">No talk scheduled this week</p>
              <Button
                as={Link}
                to="/toolbox-talk"
                size="sm"
                variant="flat"
                color="primary"
                className="mt-2"
              >
                View Archive
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Safety Tip of the Day */}
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Lightbulb size={16} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Safety Tip</h3>
                {safetyTip && (
                  <Chip size="sm" color="success" variant="flat" className="text-xs">
                    Today
                  </Chip>
                )}
              </div>
              <p className="text-xs text-gray-500">Daily reminder</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {safetyTipFetcher.state === "loading" ? (
            <div className="space-y-2">
              <div className="h-20 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100 w-3/4" />
            </div>
          ) : safetyTip ? (
            <div className="space-y-3">
              {safetyTip.featuredImage && (
                <Link to={`/safety-tips/${safetyTip.slug}`} className="block">
                  <div className="relative h-24 w-full overflow-hidden rounded-lg">
                    <img
                      src={safetyTip.featuredImage}
                      alt={safetyTip.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
              )}
              <div>
                {safetyTip.category && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="mb-1 text-xs"
                    style={{
                      backgroundColor: `${safetyTip.category.color}20`,
                      color: safetyTip.category.color,
                    }}
                  >
                    {safetyTip.category.name}
                  </Chip>
                )}
                <Link
                  to={`/safety-tips/${safetyTip.slug}`}
                  className="text-sm font-semibold text-gray-900 hover:text-emerald-600 line-clamp-2 block"
                >
                  {safetyTip.title}
                </Link>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{safetyTip.summary}</p>
              </div>
              <Button
                as={Link}
                to={`/safety-tips/${safetyTip.slug}`}
                color="success"
                variant="flat"
                size="sm"
                className="w-full"
                endContent={<ArrowRight size={14} />}
              >
                Read Tip
              </Button>
            </div>
          ) : (
            <div className="text-center py-3">
              <Lightbulb size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">No tip available today</p>
              <Button
                as={Link}
                to="/safety-tips"
                size="sm"
                variant="flat"
                color="success"
                className="mt-2"
              >
                Browse Tips
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Featured Safety Video */}
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Video size={16} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Safety Video</h3>
                {safetyVideo && (
                  <Chip size="sm" color="primary" variant="flat" className="text-xs">
                    Featured
                  </Chip>
                )}
              </div>
              <p className="text-xs text-gray-500">Watch & learn</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {safetyVideoFetcher.state === "loading" ? (
            <div className="space-y-2">
              <div className="h-24 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100 w-3/4" />
            </div>
          ) : safetyVideo ? (
            <div className="space-y-3">
              <Link to={`/safety-videos?play=${safetyVideo.id}`} className="block">
                <div className="relative h-28 w-full overflow-hidden rounded-lg bg-gray-100">
                  {safetyVideo.thumbnail ? (
                    <img
                      src={safetyVideo.thumbnail}
                      alt={safetyVideo.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                      <Video size={24} className="text-blue-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                      <Play size={18} className="text-blue-600 ml-0.5" />
                    </div>
                  </div>
                  {safetyVideo.duration > 0 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      className="absolute bottom-2 right-2 bg-black/70 text-white"
                      startContent={<Clock size={10} />}
                    >
                      {formatDuration(safetyVideo.duration)}
                    </Chip>
                  )}
                </div>
              </Link>
              <div>
                {safetyVideo.category && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="mb-1 text-xs"
                    style={{
                      backgroundColor: `${safetyVideo.category.color}20`,
                      color: safetyVideo.category.color,
                    }}
                  >
                    {safetyVideo.category.name}
                  </Chip>
                )}
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{safetyVideo.title}</h4>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{safetyVideo.description}</p>
              </div>
              <Button
                as={Link}
                to="/safety-videos"
                color="primary"
                variant="flat"
                size="sm"
                className="w-full"
                endContent={<ArrowRight size={14} />}
              >
                View Videos
              </Button>
            </div>
          ) : (
            <div className="text-center py-3">
              <Video size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">No featured video</p>
              <Button
                as={Link}
                to="/safety-videos"
                size="sm"
                variant="flat"
                color="primary"
                className="mt-2"
              >
                Browse Videos
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Today's Menu Widget */}
      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                <UtensilsCrossed size={16} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Today's Menu</h3>
                <p className="text-xs text-gray-500">Canteen</p>
              </div>
            </div>
            <Chip size="sm" color="warning" variant="flat" className="text-xs">
              {mealTimeInfo[currentMealType].label}
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {menuFetcher.state === "loading" ? (
            <div className="space-y-2">
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 animate-pulse rounded bg-gray-100 w-4/5" />
              <div className="h-4 animate-pulse rounded bg-gray-100 w-3/5" />
            </div>
          ) : todayMenu && currentMeal ? (
            <div className="space-y-3">
              <ul className="space-y-1.5">
                {currentMeal.items
                  .filter((item) => item.isAvailable)
                  .slice(0, 4)
                  .map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-orange-500 text-xs">•</span>
                      <span className="text-xs text-gray-700 flex-1 truncate">{item.name}</span>
                      <div className="flex gap-0.5">
                        {item.dietary.slice(0, 2).map((d) => (
                          <span key={d} title={dietaryInfo[d]?.label || d} className="text-xs">
                            {dietaryInfo[d]?.icon || ""}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
              </ul>
              {currentMeal.items.filter((i) => i.isAvailable).length > 4 && (
                <p className="text-xs text-gray-500">
                  +{currentMeal.items.filter((i) => i.isAvailable).length - 4} more items
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                <span>
                  {currentMeal.startTime || mealTimeInfo[currentMealType].defaultStart} -{" "}
                  {currentMeal.endTime || mealTimeInfo[currentMealType].defaultEnd}
                </span>
              </div>
              <Button
                as={Link}
                to="/canteen"
                color="warning"
                variant="flat"
                size="sm"
                className="w-full"
                endContent={<ArrowRight size={14} />}
              >
                Full Menu
              </Button>
            </div>
          ) : (
            <div className="text-center py-3">
              <UtensilsCrossed size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">No menu available today</p>
              <Button
                as={Link}
                to="/canteen"
                size="sm"
                variant="flat"
                color="warning"
                className="mt-2"
              >
                View Menu
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Featured Posts */}
      <Card className="shadow-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
              <Star size={16} className="text-yellow-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Featured Posts</h3>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {featuredNewsFetcher.state === "loading" ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2 p-2">
                  <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-gray-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPosts.length > 0 ? (
            <div className="space-y-3">
              {featuredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/news/${post.slug}`}
                  className="block cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary-100 text-xs font-bold text-primary-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-primary-600">
                        {post.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <span>{post.author}</span>
                        <span>•</span>
                        <Eye size={10} />
                        <span>{post.views}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              <Button
                as={Link}
                to="/news"
                variant="flat"
                color="warning"
                size="sm"
                className="w-full"
                endContent={<ArrowRight size={14} />}
              >
                View All News
              </Button>
            </div>
          ) : (
            <div className="text-center py-3">
              <Star size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-xs text-gray-500">No featured posts yet</p>
              <Button
                as={Link}
                to="/news"
                size="sm"
                variant="flat"
                color="warning"
                className="mt-2"
              >
                Browse News
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </aside>
  );
}
