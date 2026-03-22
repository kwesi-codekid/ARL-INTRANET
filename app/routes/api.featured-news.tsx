/**
 * Featured News API
 * Returns top featured/popular published news articles for sidebar widget
 */

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");

  await connectDB();

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "5", 10), 10);

  // Get featured published articles first, then fall back to most viewed
  const featured = await News.find({
    status: "published",
    $or: [{ publishedAt: { $lte: new Date() } }, { publishedAt: null }],
  })
    .sort({ isFeatured: -1, isPinned: -1, views: -1, publishedAt: -1 })
    .limit(limit)
    .populate("category", "name slug color")
    .populate("author", "name")
    .lean();

  const posts = featured.map((post) => ({
    id: post._id.toString(),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    views: post.views || 0,
    isFeatured: post.isFeatured || false,
    category: post.category
      ? {
          name: (post.category as unknown as { name: string }).name,
          color: (post.category as unknown as { color: string }).color,
        }
      : null,
    author: post.author
      ? (post.author as unknown as { name: string }).name
      : "ARL Team",
  }));

  return Response.json({ posts });
}
