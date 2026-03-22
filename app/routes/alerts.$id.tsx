/**
 * Alert Detail Page
 * Task: 1.2.3.3.4 - Create alert detail view
 */

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
} from "@heroui/react";
import { AlertTriangle, AlertCircle, Info, ArrowLeft, Calendar, Eye, Clock } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";
import type { SerializedAlert } from "~/lib/services/alert.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { getAlertById, incrementAlertViews, serializeAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const { id } = params;
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const alert = await getAlertById(id);
  if (!alert) {
    throw new Response("Not Found", { status: 404 });
  }

  // Increment views
  await incrementAlertViews(id);

  return Response.json({
    alert: serializeAlert(alert),
  });
}

interface LoaderData {
  alert: SerializedAlert;
}

const severityConfig = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    chipColor: "danger" as const,
    icon: AlertTriangle,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    chipColor: "warning" as const,
    icon: AlertCircle,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    chipColor: "primary" as const,
    icon: Info,
  },
};

const typeLabels: Record<string, string> = {
  safety: "Safety Alert",
  incident: "Incident Alert",
  general: "General Notice",
  maintenance: "Maintenance Notice",
  weather: "Weather Alert",
};

export default function AlertDetailPage() {
  const { alert } = useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <MainLayout user={portalUser}>
      {/* Back Button */}
      <Button
        as={Link}
        to="/alerts"
        variant="light"
        startContent={<ArrowLeft size={18} />}
        className="mb-4"
      >
        Back to Alerts
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className={`${config.bg} ${config.border} border shadow-sm`}>
            <CardHeader className="flex flex-col items-start gap-4">
              <div className="flex items-start gap-4 w-full">
                <div className={`flex-shrink-0 p-4 rounded-full ${config.iconBg}`}>
                  <Icon size={32} className={config.iconColor} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Chip size="sm" color={config.chipColor} variant="solid">
                      {alert.severity.toUpperCase()}
                    </Chip>
                    <Chip size="sm" variant="flat">
                      {typeLabels[alert.type] || alert.type}
                    </Chip>
                    {alert.isPinned && (
                      <Chip size="sm" color="secondary" variant="flat">
                        Pinned
                      </Chip>
                    )}
                    {!alert.isActive && (
                      <Chip size="sm" color="default" variant="flat">
                        Inactive
                      </Chip>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{alert.title}</h1>
                </div>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alert Info */}
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Alert Details</h3>
            </CardHeader>
            <CardBody className="pt-0 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-gray-500">Posted</p>
                  <p className="font-medium">
                    {new Date(alert.createdAt).toLocaleDateString()} at{" "}
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {alert.startDate && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Active From</p>
                    <p className="font-medium">
                      {new Date(alert.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {alert.endDate && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Active Until</p>
                    <p className="font-medium">
                      {new Date(alert.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Eye size={16} className="text-gray-400" />
                <div>
                  <p className="text-gray-500">Views</p>
                  <p className="font-medium">{alert.views}</p>
                </div>
              </div>

              {alert.author && (
                <div className="text-sm">
                  <p className="text-gray-500">Posted by</p>
                  <p className="font-medium">{alert.author.name}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Safety Reminder */}
          {alert.severity === "critical" && (
            <Card className="shadow-sm bg-red-50 border-red-200 border">
              <CardBody className="flex flex-row items-center gap-3">
                <AlertTriangle size={24} className="text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Important</h3>
                  <p className="text-sm text-red-700">
                    This is a critical alert. Please take immediate action as required.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* View All Alerts */}
          <Card className="shadow-sm">
            <CardBody>
              <Button
                as={Link}
                to="/alerts"
                color="danger"
                variant="flat"
                fullWidth
              >
                View All Alerts
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
