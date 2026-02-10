import type { SerializedToolboxTalk } from "~/lib/services/toolbox-talk.server";

/**
 * Public PSI Talk Listing Page
 * Task: 1.2.1.3.1-7 (Public PSI Talk UI)
 */

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Button,
  Chip,
  Input,
  Image,
  Pagination,
} from "@heroui/react";
import { Search, Calendar, Eye, PlayCircle, Volume2, ChevronRight } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";



const ITEMS_PER_PAGE = 12;

interface ArchiveMonth {
  year: number;
  month: number;
  count: number;
}

interface LoaderData {
  todaysTalk: SerializedToolboxTalk | null;
  talks: SerializedToolboxTalk[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  archiveMonths: ArchiveMonth[];
  searchQuery: string;
  currentYear: number | null;
  currentMonth: number | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { getTodaysToolboxTalk, getToolboxTalks, getArchiveMonths, serializeToolboxTalk } = await import("~/lib/services/toolbox-talk.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");

  // Get today's talk using service
  const todaysTalk = await getTodaysToolboxTalk();

  // Build filter options for service
  const filterOptions: Parameters<typeof getToolboxTalks>[0] = {
    status: "published",
    page,
    limit: ITEMS_PER_PAGE,
  };

  if (search) {
    filterOptions.search = search;
  }

  if (year) {
    const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
    const endDate = month
      ? new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      : new Date(parseInt(year), 11, 31, 23, 59, 59);
    filterOptions.startDate = startDate;
    filterOptions.endDate = endDate;
  }

  // Get paginated talks using service
  const { talks, total, totalPages } = await getToolboxTalks(filterOptions);

  // Get archive months using service
  const archiveMonths = await getArchiveMonths();

  // Build response data with proper serialization
  const data: LoaderData = {
    todaysTalk: todaysTalk ? serializeToolboxTalk(todaysTalk) : null,
    talks: talks.map(serializeToolboxTalk),
    pagination: { page, totalPages, total },
    archiveMonths,
    searchQuery: search,
    currentYear: year ? parseInt(year) : null,
    currentMonth: month ? parseInt(month) : null,
  };

  return Response.json(data);
}

export default function ToolboxTalkPage() {
  const {
    todaysTalk,
    talks,
    pagination,
    archiveMonths,
    searchQuery,
    currentYear,
    currentMonth,
  } = useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handleArchiveFilter = (year: number, month?: number) => {
    const params = new URLSearchParams();
    params.set("year", year.toString());
    if (month) {
      params.set("month", month.toString());
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const formatWeek = (talk: SerializedToolboxTalk) => {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (talk.week && talk.month && talk.year) {
      return `Wk ${talk.week}, ${monthNames[talk.month]}`;
    }
    // Fallback to date format for legacy data
    return new Date(talk.scheduledDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const formatFullWeek = (talk: SerializedToolboxTalk) => {
    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (talk.week && talk.month && talk.year) {
      return `Week ${talk.week} of ${monthNames[talk.month]} ${talk.year}`;
    }
    // Fallback
    return new Date(talk.scheduledDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleDateString("en-GB", { month: "long" });
  };

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case "video":
        return <PlayCircle size={20} />;
      case "audio":
        return <Volume2 size={20} />;
      default:
        return null;
    }
  };

  return (
    <MainLayout user={portalUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly PSI Talk</h1>
            <p className="text-sm text-gray-500">
              Weekly safety awareness and best practices
            </p>
          </div>
          <Input
            placeholder="Search talks..."
            defaultValue={searchQuery}
            onValueChange={handleSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-xs"
          />
        </div>

        {/* Today's Talk Feature - Task: 1.2.1.3.1 */}
        {todaysTalk && !searchQuery && !currentYear && (
          <Card className="overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 shadow-md">
            <CardHeader className="flex gap-3 border-b border-amber-200 bg-amber-100/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-amber-600" size={24} />
                <div>
                  <p className="text-lg font-bold text-amber-800">This Week's PSI Talk</p>
                  <p className="text-sm text-amber-600">{formatFullWeek(todaysTalk)}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-6">
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Media Preview */}
                {todaysTalk.featuredMedia && (
                  <div className="relative h-48 w-full overflow-hidden rounded-lg md:h-64 md:w-80 md:flex-shrink-0">
                    {todaysTalk.featuredMedia.type === "video" ? (
                      <div className="flex h-full items-center justify-center bg-gray-900">
                        <Image
                          src={todaysTalk.featuredMedia.thumbnail || "/images/video-placeholder.jpg"}
                          alt={todaysTalk.title}
                          classNames={{
                            wrapper: "w-full h-full",
                            img: "w-full h-full object-cover opacity-75",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="text-white" size={64} />
                        </div>
                      </div>
                    ) : todaysTalk.featuredMedia.type === "audio" ? (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
                        <Volume2 className="text-white" size={64} />
                      </div>
                    ) : (
                      <Image
                        src={todaysTalk.featuredMedia.url}
                        alt={todaysTalk.title}
                        classNames={{
                          wrapper: "w-full h-full",
                          img: "w-full h-full object-cover",
                        }}
                      />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="mb-3 text-xl font-bold text-gray-900">
                    {todaysTalk.title}
                  </h2>
                  <p className="mb-4 text-gray-600">{todaysTalk.summary}</p>
                  {todaysTalk.tags && todaysTalk.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {todaysTalk.tags.map((tag, index) => (
                        <Chip key={index} size="sm" variant="flat" color="warning">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Link to={`/toolbox-talk/${todaysTalk.slug}`}>
                      <Button color="warning" endContent={<ChevronRight size={18} />}>
                        View Full Talk
                      </Button>
                    </Link>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Eye size={16} />
                      {todaysTalk.views} views
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Archive Filter Display */}
        {(currentYear || searchQuery) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filtering by:</span>
            {currentYear && (
              <Chip
                variant="flat"
                color="primary"
                onClose={clearFilters}
              >
                {currentMonth ? `${getMonthName(currentMonth)} ${currentYear}` : currentYear}
              </Chip>
            )}
            {searchQuery && (
              <Chip
                variant="flat"
                color="secondary"
                onClose={clearFilters}
              >
                Search: "{searchQuery}"
              </Chip>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main Content */}
          <div className="flex-1">
            {/* Talks Grid - Task: 1.2.1.3.2 */}
            {talks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {talks.map((talk) => (
                  <Link key={talk.id} to={`/toolbox-talk/${talk.slug}`}>
                    <Card className="h-full overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                      {/* Media Thumbnail */}
                      <div className="relative h-40 bg-gray-100">
                        {talk.featuredMedia ? (
                          <>
                            <Image
                              src={
                                talk.featuredMedia.thumbnail ||
                                talk.featuredMedia.url ||
                                "/images/talk-placeholder.jpg"
                              }
                              alt={talk.title}
                              classNames={{
                                wrapper: "w-full h-full",
                                img: "w-full h-full object-cover",
                              }}
                              radius="none"
                            />
                            {talk.featuredMedia.type !== "image" && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                {getMediaIcon(talk.featuredMedia.type)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                            <Calendar className="text-amber-400" size={40} />
                          </div>
                        )}
                        <div className="absolute left-2 top-2">
                          <Chip size="sm" color="warning" variant="solid">
                            {formatWeek(talk)}
                          </Chip>
                        </div>
                      </div>
                      <CardBody className="p-4">
                        <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">
                          {talk.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {talk.summary}
                        </p>
                      </CardBody>
                      <CardFooter className="flex items-center justify-between border-t px-4 py-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Eye size={12} />
                          {talk.views}
                        </span>
                        {talk.media && talk.media.length > 0 && (
                          <div className="flex gap-1">
                            {talk.media.some((m) => m.type === "video") && (
                              <PlayCircle size={14} className="text-gray-400" />
                            )}
                            {talk.media.some((m) => m.type === "audio") && (
                              <Volume2 size={14} className="text-gray-400" />
                            )}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardBody className="py-12 text-center">
                  <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
                  <p className="text-gray-500">No PSI talks found</p>
                  {(searchQuery || currentYear) && (
                    <Button
                      className="mt-4"
                      variant="flat"
                      color="primary"
                      onPress={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  total={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  showControls
                />
              </div>
            )}
          </div>

          {/* Sidebar - Task: 1.2.1.3.5, 1.2.1.3.7 */}
          <div className="w-full lg:w-64">
            <Card className="sticky top-4 shadow-sm">
              <CardHeader className="border-b px-4 py-3">
                <h3 className="font-semibold text-gray-900">Archive</h3>
              </CardHeader>
              <CardBody className="p-0">
                {archiveMonths.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {/* Group by year */}
                    {Object.entries(
                      archiveMonths.reduce(
                        (acc, item) => {
                          if (!acc[item.year]) acc[item.year] = [];
                          acc[item.year].push(item);
                          return acc;
                        },
                        {} as Record<number, ArchiveMonth[]>
                      )
                    )
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([year, months]) => (
                        <div key={year}>
                          <button
                            onClick={() => handleArchiveFilter(Number(year))}
                            className="flex w-full items-center justify-between bg-gray-50 px-4 py-2 text-left font-medium text-gray-700 hover:bg-gray-100"
                          >
                            <span>{year}</span>
                            <span className="text-xs text-gray-500">
                              {months.reduce((sum, m) => sum + m.count, 0)} talks
                            </span>
                          </button>
                          <div>
                            {months
                              .sort((a, b) => b.month - a.month)
                              .map((item) => (
                                <button
                                  key={`${item.year}-${item.month}`}
                                  onClick={() => handleArchiveFilter(item.year, item.month)}
                                  className={`flex w-full items-center justify-between px-6 py-2 text-left text-sm hover:bg-gray-50 ${
                                    currentYear === item.year && currentMonth === item.month
                                      ? "bg-amber-50 text-amber-700"
                                      : "text-gray-600"
                                  }`}
                                >
                                  <span>{getMonthName(item.month)}</span>
                                  <span className="text-xs text-gray-400">{item.count}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No archive available
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
