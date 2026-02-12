/**
 * Public Gold Industry News Page
 * Task: 1.4.3.2 - Public Gold News UI
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Tabs,
  Tab,
  Input,
  Pagination,
  Image,
  Skeleton,
} from "@heroui/react";
import {
  Globe,
  MapPin,
  Search,
  ExternalLink,
  RefreshCw,
  Newspaper,
  Clock,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, useNavigation, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";

export async function loader({ request }: LoaderFunctionArgs) {
  const { getGoldNews, getNewsStats } = await import("~/lib/services/gold-news.server");

  const url = new URL(request.url);
  const region = url.searchParams.get("region") as "ghana" | "world" | null;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");

  const [newsResult, stats] = await Promise.all([
    getGoldNews({ region: region || undefined, search, page, limit: 12 }),
    getNewsStats(),
  ]);

  return Response.json({
    news: newsResult.news.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      source: n.source,
      url: n.url,
      summary: n.summary,
      imageUrl: n.imageUrl,
      publishedAt: n.publishedAt,
      region: n.region,
    })),
    total: newsResult.total,
    page: newsResult.page,
    totalPages: newsResult.totalPages,
    stats,
  });
}

export default function GoldNewsPage() {
  const { news, total, page, totalPages, stats } = useLoaderData<typeof loader>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const currentRegion = searchParams.get("region") || "all";
  const currentSearch = searchParams.get("search") || "";

  const handleRegionChange = (region: string) => {
    const params = new URLSearchParams(searchParams);
    if (region === "all") {
      params.delete("region");
    } else {
      params.set("region", region);
    }
    params.delete("page");
    setSearchParams(params);
  };

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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <MainLayout user={portalUser}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-100">
              <Newspaper size={28} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gold Industry News</h1>
              <p className="text-gray-600">Stay updated with mining news from Ghana and around the world</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Articles</p>
            </CardBody>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-green-600">{stats.ghana}</p>
              <p className="text-xs text-gray-500">Ghana News</p>
            </CardBody>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-blue-600">{stats.world}</p>
              <p className="text-xs text-gray-500">World News</p>
            </CardBody>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardBody className="text-center py-4">
              <p className="text-2xl font-bold text-amber-600">{stats.today}</p>
              <p className="text-xs text-gray-500">Today</p>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Region Tabs */}
              <Tabs
                selectedKey={currentRegion}
                onSelectionChange={(key) => handleRegionChange(key as string)}
                color="primary"
                variant="solid"
              >
                <Tab
                  key="all"
                  title={
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      <span>All</span>
                    </div>
                  }
                />
                <Tab
                  key="ghana"
                  title={
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>Ghana</span>
                    </div>
                  }
                />
                <Tab
                  key="world"
                  title={
                    <div className="flex items-center gap-2">
                      <Globe size={16} />
                      <span>World</span>
                    </div>
                  }
                />
              </Tabs>

              {/* Search */}
              <Input
                placeholder="Search news..."
                value={currentSearch}
                onValueChange={handleSearch}
                startContent={<Search size={16} className="text-gray-400" />}
                className="max-w-xs"
                size="sm"
                isClearable
                onClear={() => handleSearch("")}
              />
            </div>
          </CardBody>
        </Card>

        {/* News Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-sm">
                <Skeleton className="h-48 rounded-t-lg" />
                <CardBody className="space-y-3">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-6 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : news.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <Card
                  key={item.id}
                  className="shadow-sm hover:shadow-md transition-shadow"
                  isPressable
                  as="a"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Chip
                          size="sm"
                          color={item.region === "ghana" ? "success" : "primary"}
                          variant="solid"
                        >
                          {item.region === "ghana" ? "Ghana" : "World"}
                        </Chip>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-48 bg-gradient-to-br from-amber-100 to-amber-200 rounded-t-lg flex items-center justify-center">
                      <Newspaper size={48} className="text-amber-400" />
                      <div className="absolute top-2 right-2">
                        <Chip
                          size="sm"
                          color={item.region === "ghana" ? "success" : "primary"}
                          variant="solid"
                        >
                          {item.region === "ghana" ? "Ghana" : "World"}
                        </Chip>
                      </div>
                    </div>
                  )}

                  <CardBody className="p-4">
                    {/* Source & Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="font-medium text-primary-600">{item.source}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(item.publishedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    {item.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2">{item.summary}</p>
                    )}

                    {/* Read More */}
                    <div className="flex items-center gap-1 text-sm text-primary-600 mt-3">
                      <span>Read more</span>
                      <ExternalLink size={14} />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination
                  total={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  showControls
                />
              </div>
            )}
          </>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="text-center py-16">
              <Newspaper size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No news found</h3>
              <p className="text-gray-500">
                {currentSearch
                  ? "Try a different search term"
                  : "News articles will appear here once sources are configured"}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Info Footer */}
        <Card className="mt-8 bg-amber-50 border border-amber-200">
          <CardBody className="text-center py-4">
            <p className="text-sm text-amber-700">
              News is aggregated from various mining industry sources. Articles open in new tabs on external sites.
            </p>
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
}
