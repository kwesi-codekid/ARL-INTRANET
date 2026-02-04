/**
 * News Detail Page
 * Task: 1.1.3.3.4
 */

import {
  Card,
  CardBody,
  Chip,
  Avatar,
  Button,
  Image,
  Divider,
} from "@heroui/react";
import { Clock, Eye, ArrowLeft, Share2, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";

// Types for loader data
interface ArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  images?: string[];
  category?: { name: string; slug: string; color: string };
  author?: { name: string };
  publishedAt: string | null;
  views: number;
  isPinned: boolean;
  isFeatured: boolean;
}

interface RelatedNewsItem {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string;
  category?: { name: string; slug: string; color: string };
  publishedAt: string | null;
}

interface LoaderData {
  article: ArticleData;
  relatedNews: RelatedNewsItem[];
  prevArticle: { title: string; slug: string } | null;
  nextArticle: { title: string; slug: string } | null;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");

  await connectDB();

  const { slug } = params;

  const article = await News.findOne({ slug, status: "published" })
    .populate("category", "name slug color")
    .populate("author", "name");

  if (!article) {
    throw new Response("Article not found", { status: 404 });
  }

  // Increment view count
  article.views += 1;
  await article.save();

  // Get related news (same category)
  const relatedNews = await News.find({
    _id: { $ne: article._id },
    category: article.category._id,
    status: "published",
  })
    .populate("category", "name slug color")
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();

  // Get previous and next articles
  const prevArticle = await News.findOne({
    status: "published",
    publishedAt: { $lt: article.publishedAt },
  })
    .sort({ publishedAt: -1 })
    .select("title slug")
    .lean();

  const nextArticle = await News.findOne({
    status: "published",
    publishedAt: { $gt: article.publishedAt },
  })
    .sort({ publishedAt: 1 })
    .select("title slug")
    .lean();

  return Response.json({
    article: {
      id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      images: article.images,
      category: article.category,
      author: article.author,
      publishedAt: article.publishedAt?.toISOString(),
      views: article.views,
      isPinned: article.isPinned,
      isFeatured: article.isFeatured,
    },
    relatedNews: relatedNews.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      slug: n.slug,
      featuredImage: n.featuredImage,
      category: n.category,
      publishedAt: n.publishedAt?.toISOString(),
    })),
    prevArticle: prevArticle ? { title: prevArticle.title, slug: prevArticle.slug } : null,
    nextArticle: nextArticle ? { title: nextArticle.title, slug: nextArticle.slug } : null,
  });
}

export default function NewsDetailPage() {
  const { article, relatedNews, prevArticle, nextArticle } = useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <MainLayout user={portalUser}>
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          to="/news"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-500"
        >
          <ArrowLeft size={16} />
          Back to News
        </Link>

        {/* Article */}
        <article>
          {/* Header */}
          <header className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <Chip
                style={{
                  backgroundColor: `${article.category?.color}20`,
                  color: article.category?.color,
                }}
              >
                {article.category?.name}
              </Chip>
              {article.isPinned && (
                <Chip color="warning" variant="flat">
                  Pinned
                </Chip>
              )}
              {article.isFeatured && (
                <Chip color="primary" variant="flat">
                  Featured
                </Chip>
              )}
            </div>

            <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Avatar
                  name={article.author?.name?.charAt(0) || "A"}
                  size="sm"
                  classNames={{
                    base: "bg-primary-100 text-primary-700",
                  }}
                />
                <span>{article.author?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {formatDate(article.publishedAt)}
              </div>
              <div className="flex items-center gap-1">
                <Eye size={14} />
                {article.views} views
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="mb-8 overflow-hidden rounded-xl">
              <Image
                src={article.featuredImage}
                alt={article.title}
                classNames={{
                  wrapper: "w-full",
                  img: "w-full h-auto max-h-[500px] object-cover",
                }}
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-primary-500"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Image Gallery */}
          {article.images && article.images.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Gallery</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {article.images.map((img, index) => (
                  <div key={index} className="overflow-hidden rounded-lg">
                    <Image
                      src={img}
                      alt={`${article.title} - Image ${index + 1}`}
                      classNames={{
                        wrapper: "w-full",
                        img: "w-full h-32 object-cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Actions */}
          <div className="mt-8 flex items-center justify-between border-t border-b py-4">
            <div className="flex items-center gap-2">
              <Button variant="flat" size="sm" startContent={<Share2 size={16} />}>
                Share
              </Button>
              <Button variant="flat" size="sm" startContent={<Bookmark size={16} />}>
                Save
              </Button>
            </div>
          </div>
        </article>

        {/* Navigation */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {prevArticle ? (
            <Link to={`/news/${prevArticle.slug}`}>
              <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
                <CardBody className="flex flex-row items-center gap-3">
                  <ChevronLeft size={20} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Previous</p>
                    <p className="line-clamp-1 font-medium text-gray-900">
                      {prevArticle.title}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ) : (
            <div />
          )}
          {nextArticle && (
            <Link to={`/news/${nextArticle.slug}`}>
              <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
                <CardBody className="flex flex-row items-center justify-end gap-3 text-right">
                  <div>
                    <p className="text-xs text-gray-500">Next</p>
                    <p className="line-clamp-1 font-medium text-gray-900">
                      {nextArticle.title}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </CardBody>
              </Card>
            </Link>
          )}
        </div>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Related Articles</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {relatedNews.map((item) => (
                <Link key={item.id} to={`/news/${item.slug}`}>
                  <Card className="h-full overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative h-32">
                      <Image
                        src={item.featuredImage || "https://via.placeholder.com/400x200?text=ARL+News"}
                        alt={item.title}
                        classNames={{
                          wrapper: "w-full h-full",
                          img: "w-full h-full object-cover",
                        }}
                        radius="none"
                      />
                    </div>
                    <CardBody className="p-3">
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${item.category?.color}20`,
                          color: item.category?.color,
                        }}
                        className="mb-2"
                      >
                        {item.category?.name}
                      </Chip>
                      <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {item.title}
                      </h3>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
