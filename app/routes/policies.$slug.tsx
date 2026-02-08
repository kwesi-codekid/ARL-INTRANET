/**
 * Public Policy Detail Page
 * View a single policy with content preview and PDF download
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Divider,
  Tab,
  Tabs,
} from "@heroui/react";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Eye,
  Clock,
  User,
  BookOpen,
  Maximize2,
  Minimize2,
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasPdf = !!policy.pdfUrl;
  const hasContent = !!policy.content;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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

        {/* Tabs: Preview / Download */}
        {(hasPdf || hasContent) && (
          <Card className="shadow-lg">
            <CardBody className="p-0">
              <Tabs
                aria-label="Policy view options"
                color="primary"
                variant="underlined"
                classNames={{
                  tabList: "px-6 pt-4 gap-6",
                  tab: "h-10",
                  panel: "p-0",
                }}
                defaultSelectedKey={hasPdf ? "preview" : "content"}
              >
                {/* PDF Preview Tab */}
                {hasPdf && (
                  <Tab
                    key="preview"
                    title={
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} />
                        <span>Preview</span>
                      </div>
                    }
                  >
                    <div className="p-4 sm:p-6">
                      {/* Toolbar */}
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500">
                          {policy.pdfFileName || "Policy Document.pdf"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            isIconOnly
                            onPress={() => setIsFullscreen(!isFullscreen)}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                          >
                            {isFullscreen ? (
                              <Minimize2 size={16} />
                            ) : (
                              <Maximize2 size={16} />
                            )}
                          </Button>
                          <Button
                            as="a"
                            href={policy.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            size="sm"
                            color="primary"
                            startContent={<Download size={16} />}
                          >
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* PDF Embed */}
                      <div
                        className={`rounded-lg overflow-hidden border border-gray-200 bg-gray-100 transition-all ${
                          isFullscreen
                            ? "fixed inset-0 z-50 rounded-none border-0"
                            : ""
                        }`}
                      >
                        {isFullscreen && (
                          <div className="flex items-center justify-between bg-white border-b px-4 py-2">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {policy.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                as="a"
                                href={policy.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                size="sm"
                                variant="flat"
                                startContent={<Download size={14} />}
                              >
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                isIconOnly
                                onPress={() => setIsFullscreen(false)}
                              >
                                <Minimize2 size={16} />
                              </Button>
                            </div>
                          </div>
                        )}
                        <iframe
                          src={`${policy.pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                          title={policy.title}
                          className={`w-full ${
                            isFullscreen
                              ? "h-[calc(100vh-49px)]"
                              : "h-[500px] sm:h-[700px]"
                          }`}
                        />
                      </div>
                    </div>
                  </Tab>
                )}

                {/* HTML Content Tab */}
                {hasContent && (
                  <Tab
                    key="content"
                    title={
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <span>Read Content</span>
                      </div>
                    }
                  >
                    <div className="p-6 sm:p-8">
                      <div
                        className="prose prose-lg max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: policy.content,
                        }}
                      />
                    </div>
                  </Tab>
                )}

                {/* Download Tab */}
                {hasPdf && (
                  <Tab
                    key="download"
                    title={
                      <div className="flex items-center gap-2">
                        <Download size={16} />
                        <span>Download</span>
                      </div>
                    }
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col items-center text-center py-8">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 mb-4">
                          <FileText size={40} className="text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {policy.pdfFileName || "Policy Document.pdf"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-md">
                          Download the official PDF document to save it locally
                          or print a copy for your records.
                        </p>
                        <Button
                          as="a"
                          href={policy.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          color="primary"
                          size="lg"
                          startContent={<Download size={20} />}
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </Tab>
                )}
              </Tabs>
            </CardBody>
          </Card>
        )}

        {/* No Content Message */}
        {!hasContent && !hasPdf && (
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
