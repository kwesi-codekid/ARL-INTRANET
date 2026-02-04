/**
 * Public Policy Detail Page
 * View a single policy with content and PDF download
 */

import { Card, CardBody, Chip, Button, Divider } from "@heroui/react";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Eye,
  Clock,
  User,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { MainLayout } from "~/components/layout";

export async function loader({ params }: LoaderFunctionArgs) {
  const { getPolicyBySlug, incrementPolicyViews, serializePolicy } = await import("~/lib/services/policy.server");
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <MainLayout>
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
        <Card className="mb-8 shadow-lg">
          <CardBody className="p-8">
            <div className="mb-6 flex flex-wrap items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100">
                <FileText size={32} className="text-primary-600" />
              </div>
              <div className="flex-1">
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {policy.title}
                </h1>
                {policy.excerpt && (
                  <p className="mt-2 text-lg text-gray-600">{policy.excerpt}</p>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
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

            {/* PDF Download */}
            {policy.pdfUrl && (
              <>
                <Divider className="my-6" />
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {policy.pdfFileName || "Policy Document.pdf"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Download the official PDF document
                      </p>
                    </div>
                  </div>
                  <Button
                    as="a"
                    href={policy.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    color="primary"
                    startContent={<Download size={18} />}
                  >
                    Download PDF
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Policy Content */}
        {policy.content && (
          <Card className="shadow-lg">
            <CardBody className="p-8">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Policy Content
              </h2>
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
