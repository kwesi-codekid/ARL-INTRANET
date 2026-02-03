/**
 * Admin Settings Page
 * Superadmin only - System configuration
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Switch,
  Divider,
  Tabs,
  Tab,
  Textarea,
} from "@heroui/react";
import {
  Globe,
  Bell,
  Shield,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  Building2,
  Upload,
  Image as ImageIcon,
  Eye,
  Target,
  Heart,
} from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";

interface CompanyImages {
  visionImage: string;
  missionImage: string;
  valuesImage: string;
}

interface LoaderData {
  settings: {
    general: Record<string, any>;
    notifications: Record<string, any>;
    security: Record<string, any>;
    system: Record<string, any>;
  };
  companyImages: CompanyImages;
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireSuperAdmin } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getSettingsForAdmin, initializeSettings } = await import(
    "~/lib/services/settings.server"
  );
  const { getCompanyImages } = await import("~/lib/services/company-info.server");

  await requireSuperAdmin(request);
  await connectDB();

  // Initialize default settings if needed
  await initializeSettings();

  const [settings, companyImages] = await Promise.all([
    getSettingsForAdmin(),
    getCompanyImages(),
  ]);

  return Response.json({ settings, companyImages });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireSuperAdmin, getSessionData } = await import(
    "~/lib/services/session.server"
  );
  const { connectDB } = await import("~/lib/db/connection.server");
  const { updateSettings, clearSettingsCache } = await import(
    "~/lib/services/settings.server"
  );

  const user = await requireSuperAdmin(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const sessionData = await getSessionData(request);

  try {
    if (intent === "update-general") {
      await updateSettings(
        {
          siteName: formData.get("siteName") as string,
          siteDescription: formData.get("siteDescription") as string,
          maintenanceMode: formData.get("maintenanceMode") === "on",
          maintenanceMessage: formData.get("maintenanceMessage") as string,
        },
        sessionData?.userId
      );
      return Response.json({ success: true, message: "General settings saved successfully" });
    }

    if (intent === "update-notifications") {
      await updateSettings(
        {
          emailNotificationsEnabled: formData.get("emailNotificationsEnabled") === "on",
          smsNotificationsEnabled: formData.get("smsNotificationsEnabled") === "on",
          adminEmailRecipients: formData.get("adminEmailRecipients") as string,
        },
        sessionData?.userId
      );
      return Response.json({ success: true, message: "Notification settings saved successfully" });
    }

    if (intent === "update-security") {
      await updateSettings(
        {
          sessionTimeoutHours: Number(formData.get("sessionTimeoutHours")),
          maxLoginAttempts: Number(formData.get("maxLoginAttempts")),
          lockoutDurationMinutes: Number(formData.get("lockoutDurationMinutes")),
          otpExpiryMinutes: Number(formData.get("otpExpiryMinutes")),
        },
        sessionData?.userId
      );
      return Response.json({ success: true, message: "Security settings saved successfully" });
    }

    if (intent === "update-system") {
      await updateSettings(
        {
          cacheEnabled: formData.get("cacheEnabled") === "on",
          debugMode: formData.get("debugMode") === "on",
        },
        sessionData?.userId
      );
      return Response.json({ success: true, message: "System settings saved successfully" });
    }

    if (intent === "clear-cache") {
      clearSettingsCache();
      return Response.json({ success: true, message: "Cache cleared successfully" });
    }

    if (intent === "update-company-images") {
      const { updateCompanyImages } = await import("~/lib/services/company-info.server");
      const { uploadFile } = await import("~/lib/services/upload.server");

      const visionFile = formData.get("visionImage") as File | null;
      const missionFile = formData.get("missionImage") as File | null;
      const valuesFile = formData.get("valuesImage") as File | null;

      const imageUpdates: Record<string, string> = {};

      // Upload new images if provided
      if (visionFile && visionFile.size > 0) {
        const result = await uploadFile(visionFile, { folder: "company" });
        if (result.success && result.url) {
          imageUpdates.visionImage = result.url;
        }
      }

      if (missionFile && missionFile.size > 0) {
        const result = await uploadFile(missionFile, { folder: "company" });
        if (result.success && result.url) {
          imageUpdates.missionImage = result.url;
        }
      }

      if (valuesFile && valuesFile.size > 0) {
        const result = await uploadFile(valuesFile, { folder: "company" });
        if (result.success && result.url) {
          imageUpdates.valuesImage = result.url;
        }
      }

      if (Object.keys(imageUpdates).length > 0) {
        await updateCompanyImages({
          ...imageUpdates,
          updatedBy: sessionData?.userId,
        });
        return Response.json({ success: true, message: "Company images updated successfully" });
      }

      return Response.json({ error: "No images were uploaded" }, { status: 400 });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Settings update error:", error);
    return Response.json(
      { error: "Failed to update settings. Please try again." },
      { status: 500 }
    );
  }
}

export default function AdminSettingsPage() {
  const { settings, companyImages } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [activeTab, setActiveTab] = useState("general");

  // Preview states for company images
  const [visionPreview, setVisionPreview] = useState<string | null>(null);
  const [missionPreview, setMissionPreview] = useState<string | null>(null);
  const [valuesPreview, setValuesPreview] = useState<string | null>(null);

  const handleImagePreview = (
    file: File | null,
    setter: (url: string | null) => void
  ) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setter(url);
    } else {
      setter(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage system configuration</p>
      </div>

      {/* Success/Error Messages */}
      {actionData?.success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          <CheckCircle size={16} />
          {actionData.message}
        </div>
      )}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        classNames={{
          tabList: "bg-white shadow-sm rounded-lg p-1",
        }}
      >
        {/* General Settings */}
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <span>General</span>
            </div>
          }
        >
          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <h2 className="font-semibold">General Settings</h2>
            </CardHeader>
            <CardBody>
              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="update-general" />

                <Input
                  name="siteName"
                  label="Site Name"
                  defaultValue={settings.general.siteName}
                  description="The name displayed in the header and browser title"
                />

                <Input
                  name="siteDescription"
                  label="Site Description"
                  defaultValue={settings.general.siteDescription}
                  description="A brief description of the intranet"
                />

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-gray-500">
                      When enabled, only admins can access the site
                    </p>
                  </div>
                  <Switch
                    name="maintenanceMode"
                    defaultSelected={settings.general.maintenanceMode}
                  />
                </div>

                <Textarea
                  name="maintenanceMessage"
                  label="Maintenance Message"
                  defaultValue={settings.general.maintenanceMessage}
                  description="Message shown to users during maintenance"
                  minRows={2}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Save size={16} />}
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Tab>

        {/* Notification Settings */}
        <Tab
          key="notifications"
          title={
            <div className="flex items-center gap-2">
              <Bell size={16} />
              <span>Notifications</span>
            </div>
          }
        >
          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <h2 className="font-semibold">Notification Settings</h2>
            </CardHeader>
            <CardBody>
              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="update-notifications" />

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Send email notifications to admins
                    </p>
                  </div>
                  <Switch
                    name="emailNotificationsEnabled"
                    defaultSelected={settings.notifications.emailNotificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-gray-500">
                      Send SMS for critical alerts
                    </p>
                  </div>
                  <Switch
                    name="smsNotificationsEnabled"
                    defaultSelected={settings.notifications.smsNotificationsEnabled}
                  />
                </div>

                <Input
                  name="adminEmailRecipients"
                  label="Admin Email Recipients"
                  defaultValue={settings.notifications.adminEmailRecipients}
                  description="Comma-separated list of admin email addresses"
                  placeholder="admin1@company.com, admin2@company.com"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Save size={16} />}
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Tab>

        {/* Security Settings */}
        <Tab
          key="security"
          title={
            <div className="flex items-center gap-2">
              <Shield size={16} />
              <span>Security</span>
            </div>
          }
        >
          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <h2 className="font-semibold">Security Settings</h2>
            </CardHeader>
            <CardBody>
              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="update-security" />

                <Input
                  name="sessionTimeoutHours"
                  type="number"
                  label="Session Timeout (hours)"
                  defaultValue={settings.security.sessionTimeoutHours?.toString()}
                  description="How long before users are logged out automatically"
                  min={1}
                  max={168}
                />

                <Input
                  name="maxLoginAttempts"
                  type="number"
                  label="Max Login Attempts"
                  defaultValue={settings.security.maxLoginAttempts?.toString()}
                  description="Number of failed attempts before temporary lockout"
                  min={3}
                  max={10}
                />

                <Input
                  name="lockoutDurationMinutes"
                  type="number"
                  label="Lockout Duration (minutes)"
                  defaultValue={settings.security.lockoutDurationMinutes?.toString()}
                  description="How long a user is locked out after max failed attempts"
                  min={5}
                  max={60}
                />

                <Input
                  name="otpExpiryMinutes"
                  type="number"
                  label="OTP Expiry (minutes)"
                  defaultValue={settings.security.otpExpiryMinutes?.toString()}
                  description="How long an OTP code is valid"
                  min={1}
                  max={15}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Save size={16} />}
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Tab>

        {/* System Settings */}
        <Tab
          key="system"
          title={
            <div className="flex items-center gap-2">
              <Database size={16} />
              <span>System</span>
            </div>
          }
        >
          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <h2 className="font-semibold">System Settings</h2>
            </CardHeader>
            <CardBody>
              <Form method="post" className="space-y-6">
                <input type="hidden" name="intent" value="update-system" />

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Enable Caching</p>
                    <p className="text-sm text-gray-500">
                      Cache frequently accessed data for better performance
                    </p>
                  </div>
                  <Switch
                    name="cacheEnabled"
                    defaultSelected={settings.system.cacheEnabled}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Debug Mode</p>
                    <p className="text-sm text-gray-500">
                      Enable detailed error messages (not recommended for production)
                    </p>
                  </div>
                  <Switch
                    name="debugMode"
                    defaultSelected={settings.system.debugMode}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Save size={16} />}
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>

          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <h2 className="font-semibold">Maintenance Actions</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Clear Cache</p>
                  <p className="text-sm text-gray-500">
                    Clear all cached data to refresh the system
                  </p>
                </div>
                <Form method="post">
                  <input type="hidden" name="intent" value="clear-cache" />
                  <Button
                    type="submit"
                    variant="flat"
                    color="warning"
                    startContent={<RefreshCw size={16} />}
                    isLoading={isSubmitting}
                  >
                    Clear Cache
                  </Button>
                </Form>
              </div>

              <Divider />

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium text-gray-700 mb-2">System Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Version</span>
                    <span className="font-mono">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Environment</span>
                    <span className="font-mono">
                      {process.env.NODE_ENV || "development"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Database</span>
                    <span className="font-mono text-green-600">Connected</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* Company Info Tab */}
        <Tab
          key="company"
          title={
            <div className="flex items-center gap-2">
              <Building2 size={16} />
              <span>Company Info</span>
            </div>
          }
        >
          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <div>
                <h2 className="font-semibold">Mission, Vision & Values Images</h2>
                <p className="text-sm text-gray-500">
                  Upload images for the company slideshow displayed on the Policies page and homepage
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <Form method="post" encType="multipart/form-data" className="space-y-8">
                <input type="hidden" name="intent" value="update-company-images" />

                {/* Vision Image */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="text-primary-500" size={20} />
                    <h3 className="font-medium">Vision Image</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                      <img
                        src={visionPreview || companyImages.visionImage}
                        alt="Vision"
                        className="w-full h-40 object-cover rounded-lg border bg-gray-100"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="mb-2 text-gray-400" size={24} />
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Click to upload</span> new image
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG (recommended: 1920x1080)</p>
                        </div>
                        <input
                          type="file"
                          name="visionImage"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImagePreview(e.target.files?.[0] || null, setVisionPreview)
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Mission Image */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="text-primary-500" size={20} />
                    <h3 className="font-medium">Mission Image</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                      <img
                        src={missionPreview || companyImages.missionImage}
                        alt="Mission"
                        className="w-full h-40 object-cover rounded-lg border bg-gray-100"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="mb-2 text-gray-400" size={24} />
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Click to upload</span> new image
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG (recommended: 1920x1080)</p>
                        </div>
                        <input
                          type="file"
                          name="missionImage"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImagePreview(e.target.files?.[0] || null, setMissionPreview)
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Values Image */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="text-primary-500" size={20} />
                    <h3 className="font-medium">Values Image</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                      <img
                        src={valuesPreview || companyImages.valuesImage}
                        alt="Values"
                        className="w-full h-40 object-cover rounded-lg border bg-gray-100"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="mb-2 text-gray-400" size={24} />
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Click to upload</span> new image
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG (recommended: 1920x1080)</p>
                        </div>
                        <input
                          type="file"
                          name="valuesImage"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImagePreview(e.target.files?.[0] || null, setValuesPreview)
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    color="primary"
                    startContent={<Save size={16} />}
                    isLoading={isSubmitting}
                  >
                    Save Images
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>

          {/* Preview Card */}
          <Card className="mt-4 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-gray-500" />
                <h2 className="font-semibold">Slideshow Preview</h2>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-500 mb-4">
                These images appear in the main slideshow on the homepage and the dedicated slideshow on the Policies page.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <img
                    src={visionPreview || companyImages.visionImage}
                    alt="Vision Preview"
                    className="w-full aspect-video object-cover rounded-lg border"
                  />
                  <p className="mt-2 text-sm font-medium text-gray-700">Vision</p>
                </div>
                <div className="text-center">
                  <img
                    src={missionPreview || companyImages.missionImage}
                    alt="Mission Preview"
                    className="w-full aspect-video object-cover rounded-lg border"
                  />
                  <p className="mt-2 text-sm font-medium text-gray-700">Mission</p>
                </div>
                <div className="text-center">
                  <img
                    src={valuesPreview || companyImages.valuesImage}
                    alt="Values Preview"
                    className="w-full aspect-video object-cover rounded-lg border"
                  />
                  <p className="mt-2 text-sm font-medium text-gray-700">Values</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
