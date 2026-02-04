/**
 * Safety Tip Detail Page
 * Task: 1.2.2.2.4 - Create single tip detail view
 */

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
} from "@heroui/react";
import { Shield, ArrowLeft, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { MainLayout } from "~/components/layout";
import type { SerializedSafetyTip } from "~/lib/services/safety.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { getSafetyTipBySlug, getSafetyTips, incrementTipViews, serializeSafetyTip } = await import("~/lib/services/safety.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const { slug } = params;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const tip = await getSafetyTipBySlug(slug);
  if (!tip) {
    throw new Response("Not Found", { status: 404 });
  }

  // Increment views
  await incrementTipViews(tip._id.toString());

  // Get related tips (same category)
  const relatedResult = await getSafetyTips({
    category: tip.category?._id.toString(),
    status: "published",
    limit: 3,
  });

  const relatedTips = relatedResult.tips
    .filter((t) => t._id.toString() !== tip._id.toString())
    .slice(0, 3);

  return Response.json({
    tip: serializeSafetyTip(tip),
    relatedTips: relatedTips.map(serializeSafetyTip),
  });
}

interface LoaderData {
  tip: SerializedSafetyTip;
  relatedTips: SerializedSafetyTip[];
}

export default function SafetyTipDetailPage() {
  const { tip, relatedTips } = useLoaderData<LoaderData>();

  return (
    <MainLayout>
      {/* Back Button */}
      <Button
        as={Link}
        to="/safety-tips"
        variant="light"
        startContent={<ArrowLeft size={18} />}
        className="mb-4"
      >
        Back to Safety Tips
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            {tip.featuredImage && (
              <div className="h-64 overflow-hidden">
                <img
                  src={tip.featuredImage}
                  alt={tip.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader className="flex-col items-start gap-3">
              <div className="flex items-center gap-2">
                {tip.category && (
                  <Chip
                    size="sm"
                    variant="flat"
                    style={{
                      backgroundColor: `${tip.category.color}20`,
                      color: tip.category.color,
                    }}
                  >
                    {tip.category.name}
                  </Chip>
                )}
                {tip.isFeatured && (
                  <Chip size="sm" color="warning" variant="flat">
                    Featured
                  </Chip>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{tip.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{new Date(tip.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{tip.views} views</span>
                </div>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div
                className="prose prose-green max-w-none"
                dangerouslySetInnerHTML={{ __html: tip.content }}
              />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Safety Reminder Card */}
          <Card className="shadow-sm bg-green-50 border-green-200">
            <CardBody className="flex flex-row items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Shield size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Safety First!</h3>
                <p className="text-sm text-green-600">
                  Always follow safety guidelines to protect yourself and others.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Related Tips */}
          {relatedTips.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Related Tips</h3>
              </CardHeader>
              <CardBody className="pt-0 space-y-3">
                {relatedTips.map((relatedTip) => (
                  <Link
                    key={relatedTip.id}
                    to={`/safety-tips/${relatedTip.slug}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 line-clamp-2 text-sm">
                      {relatedTip.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {relatedTip.summary}
                    </p>
                  </Link>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Browse More */}
          <Card className="shadow-sm">
            <CardBody>
              <Button
                as={Link}
                to="/safety-tips"
                color="success"
                variant="flat"
                fullWidth
              >
                Browse All Safety Tips
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
