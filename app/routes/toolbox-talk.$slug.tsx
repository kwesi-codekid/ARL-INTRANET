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
  Spinner,
} from "@heroui/react";
import {
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Share2,
  User,
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";

// PDF Viewer Component - uses Google Docs Viewer for reliable cross-browser PDF display
interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  fileName?: string;
}

function PDFViewer({ pdfUrl, title, fileName }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Google Docs Viewer - works reliably for displaying PDFs from any public URL
  const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  return (
    <div className="mb-6">
      {/* PDF Toolbar */}
      <div className="flex flex-col gap-2 rounded-t-lg bg-gray-800 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-red-400" size={20} />
          <span className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-none">
            {fileName || title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Open in new tab button - uses Google Docs viewer to display PDF */}
          <Button
            as="a"
            href={googleDocsViewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="flat"
            className="flex-1 sm:flex-none bg-white/20 text-white hover:bg-white/30"
            startContent={<ExternalLink size={14} />}
          >
            Open
          </Button>
          {/* Download button */}
          <Button
            as="a"
            href={pdfUrl}
            download={fileName || "document.pdf"}
            size="sm"
            color="primary"
            className="flex-1 sm:flex-none"
            startContent={<Download size={14} />}
          >
            Download
          </Button>
        </div>
      </div>

      {/* PDF Embed Area - Google Docs Viewer */}
      <div className="border border-t-0 border-gray-300 bg-white rounded-b-lg overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Spinner size="lg" color="warning" className="mb-3" />
              <p className="text-sm text-gray-600">Loading PDF document...</p>
            </div>
          </div>
        )}
        <iframe
          src={googleDocsViewerUrl}
          title={`PDF: ${title}`}
          className="w-full border-0"
          style={{ height: '75vh', minHeight: '500px' }}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}

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
  const { portalUser } = useOutletContext<PublicOutletContext>();

  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const shortMonthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatWeek = (talk: typeof relatedTalks[0] | SerializedToolboxTalk) => {
    if ('week' in talk && talk.week && talk.month && talk.year) {
      return `Week ${talk.week} of ${monthNames[talk.month]} ${talk.year}`;
    }
    // Fallback
    return new Date(talk.scheduledDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortWeek = (talk: typeof relatedTalks[0]) => {
    if (talk.featuredMedia && 'week' in talk.featuredMedia) {
      // Check if the talk object has week info
    }
    // Use scheduledDate for related talks which don't have full week info
    return new Date(talk.scheduledDate).toLocaleDateString("en-GB", {
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
    <MainLayout user={portalUser}>
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
                  {formatWeek(talk)}
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
            {/* PDF Document - Using Cloudinary image transformation */}
            {talk.featuredMedia && talk.featuredMedia.type === "pdf" && (
              <PDFViewer
                pdfUrl={talk.featuredMedia.url}
                title={talk.title}
                fileName={talk.featuredMedia.fileName}
              />
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

            {/* Summary/Description */}
            {talk.summary && (
              <div className="prose max-w-none text-gray-700">
                <p>{talk.summary}</p>
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
                          {formatShortWeek(related)}
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
