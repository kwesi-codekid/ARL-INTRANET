/**
 * Admin Create Alert Page
 * Task: 1.2.3.4.2 - Build alert creation form with severity picker
 * Task: 1.2.3.4.3 - Create scheduling interface (start/end date pickers)
 * Task: 1.2.3.4.5 - Implement alert preview
 */

import { useState } from "react";
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
import { ArrowLeft, Save, Bell, AlertTriangle, AlertCircle, Info, Eye } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useNavigation } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { createAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  return Response.json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { createAlert } = await import("~/lib/services/alert.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  const user = await requireAuth(request);
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

  await createAlert({
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
    author: user._id.toString(),
  });

  if (isActive) {
    const { sendPushNotificationToAll } = await import("~/lib/services/push-notification.server");
    sendPushNotificationToAll({
      title: "Alert: " + title,
      body: message.substring(0, 120),
      url: "/alerts",
    });
  }

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

export default function AdminCreateAlertPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("info");
  const [type, setType] = useState("general");
  const [isActive, setIsActive] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [playSound, setPlaySound] = useState(false);

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
          <h1 className="text-2xl font-bold text-gray-900">Create Alert</h1>
          <p className="text-gray-500">Create a new safety or incident alert</p>
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
                    onChange={(e) => setType(e.target.value)}
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
                    description="Leave empty to start immediately"
                  />
                  <Input
                    type="datetime-local"
                    label="End Date"
                    name="endDate"
                    description="Leave empty for no end date"
                  />
                </div>
              </CardBody>
            </Card>

            {/* Preview - Task: 1.2.3.4.5 */}
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
                  Create Alert
                </Button>
              </CardBody>
            </Card>

            {/* Tips */}
            <Card className="shadow-sm bg-amber-50 border-amber-200 border">
              <CardBody className="flex flex-row items-start gap-3">
                <AlertCircle size={24} className="text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800">Alert Tips</h3>
                  <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                    <li>Use critical severity sparingly</li>
                    <li>Keep messages clear and concise</li>
                    <li>Include action items if needed</li>
                    <li>Set end dates for temporary alerts</li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
