/**
 * Public News Listing Page
 * Task: 1.1.3.3.1
 */

import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Input,
  Image,
  Pagination,
} from "@heroui/react";
import { Search, Clock, Eye, ArrowRight } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";



const ITEMS_PER_PAGE = 9;

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News, NewsCategory } = await import("~/lib/db/models/news.server");

  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const category = url.searchParams.get("category") || "all";
  const search = url.searchParams.get("search") || "";

  // Build query
  const query: Record<string, unknown> = {
    status: "published",
  };

  // Base conditions for published articles
  const baseConditions = [
    { publishedAt: { $lte: new Date() } },
    { publishedAt: null },
  ];

  if (category !== "all") {
    const cat = await NewsCategory.findOne({ slug: category });
    if (cat) {
      query.category = cat._id;
    }
  }

  // Fuzzy search using regex - searches title, excerpt, and content
  if (search) {
    // Escape special regex characters and create case-insensitive pattern
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    query.$and = [
      { $or: baseConditions },
      {
        $or: [
          { title: searchRegex },
          { excerpt: searchRegex },
          { content: searchRegex },
        ],
      },
    ];
  } else {
    query.$or = baseConditions;
  }

  // Get categories
  const categories = await NewsCategory.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  // Get total count
  const totalCount = await News.countDocuments(query);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get news with pagination
  const news = await News.find(query)
    .populate("category", "name slug color")
    .populate("author", "name")
    .sort({ isPinned: -1, publishedAt: -1 })
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .lean();

  // Get featured news (separate query)
  const featuredNews = await News.find({
    status: "published",
    isFeatured: true,
  })
    .populate("category", "name slug color")
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();

  return Response.json({
    news: news.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      slug: n.slug,
      excerpt: n.excerpt || n.content.substring(0, 150) + "...",
      featuredImage: n.featuredImage,
      category: n.category,
      author: n.author,
      publishedAt: n.publishedAt?.toISOString(),
      views: n.views,
      isPinned: n.isPinned,
    })),
    featuredNews: featuredNews.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      slug: n.slug,
      excerpt: n.excerpt || n.content.substring(0, 100) + "...",
      featuredImage: n.featuredImage,
      category: n.category,
    })),
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      color: c.color,
    })),
    pagination: {
      page,
      totalPages,
      totalCount,
    },
    currentCategory: category,
    searchQuery: search,
  });
}

export default function NewsListingPage() {
  const { news, featuredNews, categories, pagination, currentCategory, searchQuery } =
    useLoaderData<typeof loader>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", category);
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

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <MainLayout user={portalUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">News & Announcements</h1>
            <p className="text-sm text-gray-500">
              Stay updated with the latest from ARL
            </p>
          </div>
          <Input
            placeholder="Search news..."
            defaultValue={searchQuery}
            onValueChange={handleSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-xs"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <Chip
            as="button"
            variant={currentCategory === "all" ? "solid" : "flat"}
            color={currentCategory === "all" ? "primary" : "default"}
            className="cursor-pointer transition-all"
            onClick={() => handleCategoryChange("all")}
          >
            All News
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat.slug}
              as="button"
              variant={currentCategory === cat.slug ? "solid" : "flat"}
              className="cursor-pointer transition-all"
              style={
                currentCategory === cat.slug
                  ? { backgroundColor: cat.color, color: "white" }
                  : { backgroundColor: `${cat.color}20`, color: cat.color }
              }
              onClick={() => handleCategoryChange(cat.slug)}
            >
              {cat.name}
            </Chip>
          ))}
        </div>

        {/* News Grid */}
        {news.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Link key={item.id} to={`/news/${item.slug}`}>
                <Card className="h-full overflow-hidden shadow-sm transition-shadow hover:shadow-md group">
                  {/* Image Section */}
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={item.featuredImage || "https://via.placeholder.com/400x200?text=ARL+News"}
                      alt={item.title}
                      classNames={{
                        wrapper: "w-full h-full",
                        img: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                      }}
                      radius="none"
                    />
                    {/* Badges on image */}
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Chip
                        size="sm"
                        style={{ backgroundColor: item.category?.color || "#D4AF37" }}
                        className="text-white font-medium"
                      >
                        {item.category?.name}
                      </Chip>
                      {item.isPinned && (
                        <Chip size="sm" color="warning">
                          Pinned
                        </Chip>
                      )}
                    </div>
                  </div>
                  {/* Content Section - Solid Background */}
                  <CardBody className="p-3 bg-white">
                    <h3 className="line-clamp-2 font-semibold text-gray-900 text-sm">
                      {item.title}
                    </h3>
                    <p className="line-clamp-2 text-xs text-gray-600 mt-1">
                      {item.excerpt}
                    </p>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(item.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {item.views}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="py-12 text-center">
              <p className="text-gray-500">No news articles found</p>
            </CardBody>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              total={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              showControls
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
