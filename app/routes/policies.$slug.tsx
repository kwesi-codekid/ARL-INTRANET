/**
 * Public Policy Detail Page
 * View a single policy with content and PDF viewer
 */

import { useState } from "react";
import { Card, CardBody, Chip, Button, Spinner } from "@heroui/react";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Eye,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";

export async function loader({ params }: LoaderFunctionArgs) {
  const { getPolicyBySlug, incrementPolicyViews, serializePolicy } =
    await import("~/lib/services/policy.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const slug = params.slug;
  if (!slug) {
    throw new Response("Policy slug is required", { status: 400 });
  }

  const policy = await getPolicyBySlug(slug);

  if (!policy || policy.status !== "published") {
    throw new Response("Policy not found", { status: 404 });
  }

  // Increment views
  await incrementPolicyViews(policy._id.toString());

  return Response.json({
    policy: serializePolicy(policy),
  });
}

export default function PolicyDetailPage() {
  const { policy } = useLoaderData<typeof loader>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const googleDocsViewerUrl = policy.pdfUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(policy.pdfUrl)}&embedded=true`
    : "";

  return (
    <MainLayout user={portalUser}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back Link */}
        <Link
          to="/policies"
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to Policies
        </Link>

        {/* Header */}
        <Card className="mb-6 shadow-lg">
          <CardBody className="p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 flex-shrink-0">
                <FileText size={28} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                {typeof policy.category === "object" && policy.category && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="mb-2"
                    style={{
                      backgroundColor: `${policy.category.color}20`,
                      color: policy.category.color,
                    }}
                  >
                    {policy.category.name}
                  </Chip>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {policy.title}
                </h1>
                {policy.excerpt && (
                  <p className="mt-2 text-base sm:text-lg text-gray-600">
                    {policy.excerpt}
                  </p>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500">
              {policy.version && (
                <span className="flex items-center gap-2">
                  <FileText size={16} />
                  Version {policy.version}
                </span>
              )}
              {policy.effectiveDate && (
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  Effective: {formatDate(policy.effectiveDate)}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Eye size={16} />
                {policy.views} views
              </span>
              <span className="flex items-center gap-2">
                <Clock size={16} />
                Updated: {formatDate(policy.updatedAt)}
              </span>
              {typeof policy.createdBy === "object" && policy.createdBy && (
                <span className="flex items-center gap-2">
                  <User size={16} />
                  {policy.createdBy.name}
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        {/* PDF Viewer - same as PSI talk */}
        {policy.pdfUrl && (
          <div className="mb-6">
            {/* PDF Toolbar */}
            <div className="flex flex-col gap-2 rounded-t-lg bg-gray-800 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileText className="text-red-400" size={20} />
                <span className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-none">
                  {policy.pdfFileName || "Policy Document.pdf"}
                </span>
              </div>
              <div className="flex items-center gap-2">
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
                <Button
                  as="a"
                  href={policy.pdfUrl}
                  download={policy.pdfFileName || "document.pdf"}
                  size="sm"
                  color="primary"
                  className="flex-1 sm:flex-none"
                  startContent={<Download size={14} />}
                >
                  Download
                </Button>
              </div>
            </div>

            {/* PDF Embed - Google Docs Viewer */}
            <div className="border border-t-0 border-gray-300 bg-white rounded-b-lg overflow-hidden relative">
              {isPdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center">
                    <Spinner size="lg" color="warning" className="mb-3" />
                    <p className="text-sm text-gray-600">Loading PDF document...</p>
                  </div>
                </div>
              )}
              <iframe
                src={googleDocsViewerUrl}
                title={`PDF: ${policy.title}`}
                className="w-full border-0"
                style={{ height: "75vh", minHeight: "500px" }}
                onLoad={() => setIsPdfLoading(false)}
              />
            </div>
          </div>
        )}

        {/* Policy Content */}
        {policy.content && (
          <Card className="shadow-lg">
            <CardBody className="p-6 sm:p-8">
              <div
                className="prose prose-lg max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: policy.content }}
              />
            </CardBody>
          </Card>
        )}

        {/* No Content Message */}
        {!policy.content && !policy.pdfUrl && (
          <Card className="py-12">
            <CardBody className="text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">
                Content coming soon
              </h3>
              <p className="mt-2 text-gray-500">
                This policy document is being prepared. Please check back later.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
