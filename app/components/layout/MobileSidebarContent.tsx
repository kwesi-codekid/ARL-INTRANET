import { Card, CardBody, Button, Input, Chip } from "@heroui/react";
import { Shield, Phone, Search, ArrowRight, FileText, Star, Eye } from "lucide-react";
import { Form, Link, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import type { SerializedToolboxTalk } from "~/lib/services/toolbox-talk.server";

interface WeeklyTalkData {
  talk: SerializedToolboxTalk | null;
  weekRange: { start: string; end: string };
}

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

export function MobileSidebarContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const toolboxTalkFetcher = useFetcher<WeeklyTalkData>();
  const featuredNewsFetcher = useFetcher<FeaturedNewsData>();

  useEffect(() => {
    toolboxTalkFetcher.load("/api/toolbox-talk-weekly");
    featuredNewsFetcher.load("/api/featured-news?limit=3");
  }, []);

  const weeklyTalk = toolboxTalkFetcher.data?.talk || null;
  const featuredPosts = featuredNewsFetcher.data?.posts || [];

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

      {/* Directory Search - Full width */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Phone size={16} className="text-blue-600" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">Directory Search</span>
              <p className="text-xs text-gray-500">Find contacts quickly</p>
            </div>
          </div>
          <Form method="get" action="/directory">
            <Input
              name="search"
              placeholder="Search by name, dept, or extension..."
              size="sm"
              startContent={<Search size={14} className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              classNames={{
                inputWrapper: "bg-gray-50",
                input: "text-sm",
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
        </CardBody>
      </Card>

      {/* Weekly PSI Talk - Full width */}
      {weeklyTalk && (
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <div className="flex gap-4">
              {weeklyTalk.featuredMedia?.url && (
                <Link to={`/toolbox-talk/${weeklyTalk.slug}`} className="shrink-0">
                  <div className="relative h-24 w-32 overflow-hidden rounded-lg">
                    {weeklyTalk.featuredMedia.type === "pdf" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                        <FileText size={28} className="text-green-600 mb-1" />
                        <span className="text-xs font-medium text-green-700">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={weeklyTalk.featuredMedia.thumbnail || weeklyTalk.featuredMedia.url}
                        alt={weeklyTalk.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">This Week's PSI Talk</span>
                  <Chip size="sm" color="success" variant="flat" className="text-xs">
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
                  className="mt-3"
                  endContent={<ArrowRight size={14} />}
                >
                  {weeklyTalk.featuredMedia?.type === "pdf" ? "View PDF" : "Read Talk"}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* No PSI talk fallback */}
      {!weeklyTalk && (
        <Card className="shadow-sm">
          <CardBody className="p-4 text-center">
            <Shield size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No PSI talk this week</p>
            <Button
              as={Link}
              to="/toolbox-talk"
              size="sm"
              variant="flat"
              color="success"
              className="mt-2"
            >
              View Archive
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                <Star size={16} className="text-yellow-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Featured Posts</span>
            </div>
            <div className="space-y-2">
              {featuredPosts.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/news/${post.slug}`}
                  className="flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary-100 text-xs font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {post.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{post.author}</span>
                      <span>•</span>
                      <Eye size={10} />
                      <span>{post.views}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Button
              as={Link}
              to="/news"
              variant="flat"
              color="warning"
              size="sm"
              className="mt-3 w-full"
              endContent={<ArrowRight size={14} />}
            >
              View All News
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
