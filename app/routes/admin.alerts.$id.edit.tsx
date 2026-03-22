/**
 * Admin Edit Alert Page
 * Task: 1.2.3.4.6 - Create alert edit functionality
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
  Chip,
  Divider,
} from "@heroui/react";
import { ArrowLeft, Save, AlertTriangle, AlertCircle, Info, Eye } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useNavigation, useLoaderData } from "react-router";
import type { SerializedAlert } from "~/lib/services/alert.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getAlertById, updateAlert, serializeAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const alert = await getAlertById(params.id!);
  if (!alert) {
    throw new Response("Alert not found", { status: 404 });
  }

  return Response.json({ alert: serializeAlert(alert) });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getAlertById, updateAlert, serializeAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const message = formData.get("message") as string;
  const severity = formData.get("severity") as "info" | "warning" | "critical";
  const type = formData.get("type") as "safety" | "incident" | "general" | "maintenance" | "weather";
  const isActive = formData.get("isActive") === "true";
  const isPinned = formData.get("isPinned") === "true";
  const showPopup = formData.get("showPopup") === "true";
  const showBanner = formData.get("showBanner") === "true";
  const playSound = formData.get("playSound") === "true";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  await updateAlert(params.id!, {
    title,
    message,
    severity,
    type,
    isActive,
    isPinned,
    showPopup,
    showBanner,
    playSound,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return redirect("/admin/alerts");
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

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Format: YYYY-MM-DDTHH:mm
  return date.toISOString().slice(0, 16);
}

export default function AdminEditAlertPage() {
  const { alert } = useLoaderData<{ alert: SerializedAlert }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [title, setTitle] = useState(alert.title);
  const [message, setMessage] = useState(alert.message);
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">(alert.severity);
  const [type, setType] = useState<"safety" | "incident" | "general" | "maintenance" | "weather">(alert.type);
  const [isActive, setIsActive] = useState(alert.isActive);
  const [isPinned, setIsPinned] = useState(alert.isPinned);
  const [showPopup, setShowPopup] = useState(alert.showPopup);
  const [showBanner, setShowBanner] = useState(alert.showBanner);
  const [playSound, setPlaySound] = useState(alert.playSound);

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button as={Link} to="/admin/alerts" variant="light" isIconOnly>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Alert</h1>
          <p className="text-gray-500">Modify alert details and settings</p>
        </div>
      </div>

      <Form method="post">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Alert Content</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Title"
                  name="title"
                  isRequired
                  placeholder="e.g., Emergency Evacuation Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <Textarea
                  label="Message"
                  name="message"
                  isRequired
                  placeholder="Detailed alert message..."
                  minRows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Classification</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Severity"
                    name="severity"
                    isRequired
                    selectedKeys={[severity]}
                    onChange={(e) => setSeverity(e.target.value as typeof severity)}
                    description="Critical alerts are displayed prominently"
                  >
                    <SelectItem key="info" startContent={<Info size={16} className="text-blue-500" />}>
                      Info
                    </SelectItem>
                    <SelectItem key="warning" startContent={<AlertCircle size={16} className="text-amber-500" />}>
                      Warning
                    </SelectItem>
                    <SelectItem key="critical" startContent={<AlertTriangle size={16} className="text-red-500" />}>
                      Critical
                    </SelectItem>
                  </Select>

                  <Select
                    label="Type"
                    name="type"
                    isRequired
                    selectedKeys={[type]}
                    onChange={(e) => setType(e.target.value as typeof type)}
                  >
                    <SelectItem key="safety">Safety Alert</SelectItem>
                    <SelectItem key="incident">Incident Alert</SelectItem>
                    <SelectItem key="general">General Notice</SelectItem>
                    <SelectItem key="maintenance">Maintenance</SelectItem>
                    <SelectItem key="weather">Weather Alert</SelectItem>
                  </Select>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Schedule (Optional)</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    type="datetime-local"
                    label="Start Date"
                    name="startDate"
                    defaultValue={formatDateForInput(alert.startDate)}
                    description="Leave empty to start immediately"
                  />
                  <Input
                    type="datetime-local"
                    label="End Date"
                    name="endDate"
                    defaultValue={formatDateForInput(alert.endDate)}
                    description="Leave empty for no end date"
                  />
                </div>
              </CardBody>
            </Card>

            {/* Preview */}
            <Card className={`shadow-sm ${config.bg} ${config.border} border`}>
              <CardHeader className="flex items-center gap-2">
                <Eye size={18} className="text-gray-500" />
                <h2 className="font-semibold">Preview</h2>
              </CardHeader>
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-3 rounded-full ${config.iconBg}`}>
                    <Icon size={24} className={config.iconColor} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Chip size="sm" color={config.chipColor} variant="flat">
                        {severity.toUpperCase()}
                      </Chip>
                      <Chip size="sm" variant="flat">
                        {type}
                      </Chip>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {title || "Alert Title"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {message || "Alert message will appear here..."}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Publishing</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <input type="hidden" name="isActive" value={String(isActive)} />
                <input type="hidden" name="isPinned" value={String(isPinned)} />
                <input type="hidden" name="showPopup" value={String(showPopup)} />
                <input type="hidden" name="showBanner" value={String(showBanner)} />
                <input type="hidden" name="playSound" value={String(playSound)} />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Active</span>
                  <Switch isSelected={isActive} onValueChange={setIsActive} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Pinned</span>
                  <Switch isSelected={isPinned} onValueChange={setIsPinned} />
                </div>

                <Divider />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Popup</span>
                  <Switch isSelected={showPopup} onValueChange={setShowPopup} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Banner</span>
                  <Switch isSelected={showBanner} onValueChange={setShowBanner} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Play Sound</span>
                  <Switch isSelected={playSound} onValueChange={setPlaySound} />
                </div>

                <Divider />

                <Button
                  type="submit"
                  color="danger"
                  fullWidth
                  startContent={<Save size={18} />}
                  isLoading={isSubmitting}
                >
                  Update Alert
                </Button>
              </CardBody>
            </Card>

            {/* Stats */}
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Stats</h2>
              </CardHeader>
              <CardBody className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Views</span>
                  <span className="font-medium">{alert.views}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium">
                    {new Date(alert.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
