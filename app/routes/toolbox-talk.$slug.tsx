import type { SerializedToolboxTalk, AdjacentTalks } from "~/lib/services/toolbox-talk.server";

/**
 * Single Toolbox Talk Detail Page
 * Task: 1.2.1.3.3-4 (Video/Audio Player Integration)
 */

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Image,
  Divider,
} from "@heroui/react";
import {
  Calendar,
  Eye,
  PlayCircle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Share2,
  User,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { MainLayout } from "~/components/layout";



interface LoaderData {
  talk: SerializedToolboxTalk;
  navigation: AdjacentTalks;
  relatedTalks: Array<{
    id: string;
    title: string;
    slug: string;
    scheduledDate: string;
    featuredMedia: SerializedToolboxTalk["featuredMedia"];
  }>;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { getToolboxTalkBySlug, incrementViews, getPastToolboxTalks, getAdjacentToolboxTalks, serializeToolboxTalk } = await import("~/lib/services/toolbox-talk.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const { slug } = params;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const talk = await getToolboxTalkBySlug(slug);

  if (!talk || talk.status !== "published") {
    throw new Response("Not Found", { status: 404 });
  }

  // Increment view count
  await incrementViews(talk._id.toString());

  // Get adjacent talks for navigation using service
  const navigation = await getAdjacentToolboxTalks(talk.scheduledDate);

  // Get related/recent talks using service
  const recentTalks = await getPastToolboxTalks(4);
  const relatedTalks = recentTalks
    .filter((t) => t._id.toString() !== talk._id.toString())
    .slice(0, 3)
    .map((t) => ({
      id: t._id.toString(),
      title: t.title,
      slug: t.slug,
      scheduledDate: t.scheduledDate.toISOString(),
      featuredMedia: t.featuredMedia || null,
    }));

  // Serialize the main talk
  const serializedTalk = serializeToolboxTalk(talk);
  // Update views to reflect the increment
  serializedTalk.views = talk.views + 1;

  const data: LoaderData = {
    talk: serializedTalk,
    navigation,
    relatedTalks,
  };

  return Response.json(data);
}

export default function ToolboxTalkDetailPage() {
  const { talk, navigation, relatedTalks } = useLoaderData<LoaderData>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: talk.title,
          text: talk.summary || talk.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          to="/toolbox-talk"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft size={16} />
          Back to Toolbox Talks
        </Link>

        {/* Main Content Card */}
        <Card className="overflow-hidden shadow-md">
          {/* Header */}
          <CardHeader className="flex flex-col gap-4 border-b bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-amber-600" size={20} />
                <span className="font-medium text-amber-700">
                  {formatDate(talk.scheduledDate)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye size={16} />
                  {talk.views} views
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={handleShare}
                >
                  <Share2 size={16} />
                </Button>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{talk.title}</h1>
            {talk.author && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} />
                <span>By {talk.author.name}</span>
              </div>
            )}
          </CardHeader>

          <CardBody className="p-6">
            {/* Featured Media - Task: 1.2.1.3.3, 1.2.1.3.4 */}
            {talk.featuredMedia && (
              <div className="mb-6">
                {talk.featuredMedia.type === "video" ? (
                  // Task: 1.2.1.2.5 - Video player component
                  <div className="relative overflow-hidden rounded-lg bg-black">
                    <video
                      controls
                      className="w-full"
                      poster={talk.featuredMedia.thumbnail}
                      preload="metadata"
                    >
                      <source src={talk.featuredMedia.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {talk.featuredMedia.caption && (
                      <p className="mt-2 text-center text-sm text-gray-500">
                        {talk.featuredMedia.caption}
                      </p>
                    )}
                  </div>
                ) : talk.featuredMedia.type === "audio" ? (
                  // Task: 1.2.1.2.6 - Audio player component
                  <div className="rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 p-6">
                    <div className="mb-4 flex items-center justify-center">
                      <Volume2 className="text-amber-600" size={48} />
                    </div>
                    <audio controls className="w-full" preload="metadata">
                      <source src={talk.featuredMedia.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    {talk.featuredMedia.caption && (
                      <p className="mt-2 text-center text-sm text-gray-600">
                        {talk.featuredMedia.caption}
                      </p>
                    )}
                  </div>
                ) : (
                  <Image
                    src={talk.featuredMedia.url}
                    alt={talk.title}
                    className="w-full rounded-lg"
                  />
                )}
              </div>
            )}

            {/* Tags */}
            {talk.tags && talk.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {talk.tags.map((tag, index) => (
                  <Chip key={index} size="sm" variant="flat" color="warning">
                    {tag}
                  </Chip>
                ))}
              </div>
            )}

            {/* Content */}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: talk.content }}
            />

            {/* Additional Media Gallery */}
            {talk.media && talk.media.length > 0 && (
              <div className="mt-8">
                <Divider className="mb-6" />
                <h3 className="mb-4 font-semibold text-gray-900">
                  Additional Resources
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {talk.media.map((item, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border bg-gray-50"
                    >
                      {item.type === "video" ? (
                        <video
                          controls
                          className="w-full"
                          poster={item.thumbnail}
                          preload="metadata"
                        >
                          <source src={item.url} type="video/mp4" />
                        </video>
                      ) : item.type === "audio" ? (
                        <div className="p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Volume2 size={20} className="text-amber-600" />
                            <span className="text-sm font-medium">
                              {item.caption || `Audio ${index + 1}`}
                            </span>
                          </div>
                          <audio controls className="w-full" preload="metadata">
                            <source src={item.url} type="audio/mpeg" />
                          </audio>
                        </div>
                      ) : (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <Image
                            src={item.url}
                            alt={item.caption || `Image ${index + 1}`}
                            className="aspect-video object-cover"
                          />
                        </a>
                      )}
                      {item.caption && item.type !== "audio" && (
                        <p className="p-2 text-sm text-gray-600">{item.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>

          {/* Navigation */}
          <div className="flex items-stretch border-t">
            {navigation.prev ? (
              <Link
                to={`/toolbox-talk/${navigation.prev.slug}`}
                className="flex flex-1 items-center gap-2 border-r p-4 hover:bg-gray-50"
              >
                <ChevronLeft size={20} className="text-gray-400" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Previous</p>
                  <p className="truncate text-sm font-medium text-gray-700">
                    {navigation.prev.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex-1 border-r" />
            )}
            {navigation.next ? (
              <Link
                to={`/toolbox-talk/${navigation.next.slug}`}
                className="flex flex-1 items-center justify-end gap-2 p-4 text-right hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Next</p>
                  <p className="truncate text-sm font-medium text-gray-700">
                    {navigation.next.title}
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </Card>

        {/* Related Talks */}
        {relatedTalks.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Recent Toolbox Talks
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedTalks.map((related) => (
                <Link key={related.id} to={`/toolbox-talk/${related.slug}`}>
                  <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative h-32 bg-gray-100">
                      {related.featuredMedia ? (
                        <Image
                          src={
                            related.featuredMedia.thumbnail ||
                            related.featuredMedia.url
                          }
                          alt={related.title}
                          classNames={{
                            wrapper: "w-full h-full",
                            img: "w-full h-full object-cover",
                          }}
                          radius="none"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                          <Calendar className="text-amber-400" size={32} />
                        </div>
                      )}
                      <div className="absolute left-2 top-2">
                        <Chip size="sm" color="warning" variant="solid">
                          {formatShortDate(related.scheduledDate)}
                        </Chip>
                      </div>
                    </div>
                    <CardBody className="p-3">
                      <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
                        {related.title}
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
