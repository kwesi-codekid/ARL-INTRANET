/**
 * Admin Create Safety Tip Page
 * Task: 1.2.2.4.2 - Build safety tip creation form
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
} from "@heroui/react";
import { ArrowLeft, Save, Shield } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, Link, redirect, useNavigation } from "react-router";
import { RichTextEditor } from "~/components/admin";
import type { SerializedSafetyCategory } from "~/lib/services/safety.server";

interface LoaderData {
  categories: SerializedSafetyCategory[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getSafetyCategories, serializeSafetyCategory } = await import("~/lib/services/safety.server");

  await requireAuth(request);
  await connectDB();

  const categories = await getSafetyCategories(true);

  return Response.json({
    categories: categories.map(serializeSafetyCategory),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { createSafetyTip, generateUniqueTipSlug } = await import("~/lib/services/safety.server");
  const { uploadFile } = await import("~/lib/services/upload.server");

  const user = await requireAuth(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const summary = formData.get("summary") as string;
  const category = formData.get("category") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";
  const showInSlideshow = formData.get("showInSlideshow") === "true";
  const icon = formData.get("icon") as string;

  // Handle image upload
  let featuredImage = "";
  const imageFile = formData.get("featuredImage") as File;
  if (imageFile && imageFile.size > 0) {
    const uploadResult = await uploadFile(imageFile, "safety-tips");
    featuredImage = uploadResult.url;
  }

  // Handle PDF document upload
  let documentUrl = "";
  const documentFile = formData.get("document") as File;
  if (documentFile && documentFile.size > 0) {
    // Save PDF to safety-documents folder
    const { uploadDocument } = await import("~/lib/services/upload.server");
    const docResult = await uploadDocument(documentFile, "safety-documents");
    documentUrl = docResult.url;
  }

  const slug = await generateUniqueTipSlug(title);

  await createSafetyTip({
    title,
    slug,
    content,
    summary,
    category,
    author: user._id.toString(),
    featuredImage,
    documentUrl,
    icon,
    status,
    isFeatured,
    showInSlideshow,
  });

  if (status === "published") {
    const { sendPushNotificationToAll } = await import("~/lib/services/push-notification.server");
    sendPushNotificationToAll({
      title: "Safety Tip: " + title,
      body: summary || title,
      url: "/safety-tips",
    });
  }

  return redirect("/admin/safety-tips");
}

export default function AdminCreateSafetyTipPage() {
  const { categories } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isFeatured, setIsFeatured] = useState(false);
  const [showInSlideshow, setShowInSlideshow] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button as={Link} to="/admin/safety-tips" variant="light" isIconOnly>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Safety Tip</h1>
          <p className="text-gray-500">Add a new safety tip for employees</p>
        </div>
      </div>

      <Form method="post" encType="multipart/form-data">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Tip Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Title"
                  name="title"
                  isRequired
                  placeholder="e.g., Always Wear Your PPE"
                />

                <Textarea
                  label="Summary"
                  name="summary"
                  placeholder="Brief summary of the safety tip"
                  maxLength={300}
                  description="Max 300 characters"
                  minRows={2}
                />

                <RichTextEditor
                  name="content"
                  label="Content"
                  placeholder="Full content of the safety tip..."
                  isRequired
                  minHeight="250px"
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Featured Image</h2>
              </CardHeader>
              <CardBody>
                <Input
                  type="file"
                  name="featuredImage"
                  accept="image/*"
                  description="Recommended size: 800x400 pixels. Used as preview for slideshow."
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">PDF Document (Optional)</h2>
              </CardHeader>
              <CardBody>
                <Input
                  type="file"
                  name="document"
                  accept=".pdf,application/pdf"
                  description="Upload a PDF document for this safety tip. Will be shown in slideshow if enabled."
                />
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
                <Select
                  label="Status"
                  name="status"
                  defaultSelectedKeys={["draft"]}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                </Select>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Featured Tip</span>
                  <Switch
                    name="isFeatured"
                    value="true"
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <span className="text-sm font-medium">Show in Homepage Slideshow</span>
                    <p className="text-xs text-gray-500">Display this tip in the main carousel</p>
                  </div>
                  <Switch
                    name="showInSlideshow"
                    value="true"
                    isSelected={showInSlideshow}
                    onValueChange={setShowInSlideshow}
                    color="success"
                  />
                </div>

                <Button
                  type="submit"
                  color="success"
                  fullWidth
                  startContent={<Save size={18} />}
                  isLoading={isSubmitting}
                >
                  Save Tip
                </Button>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Category</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  label="Category"
                  name="category"
                  isRequired
                  placeholder="Select a category"
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>

                <Input
                  label="Icon"
                  name="icon"
                  placeholder="e.g., shield, hard-hat"
                  description="Lucide icon name"
                />
              </CardBody>
            </Card>

            {/* Quick Tips */}
            <Card className="shadow-sm bg-green-50 border-green-200">
              <CardBody className="flex flex-row items-start gap-3">
                <Shield size={24} className="text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800">Writing Tips</h3>
                  <ul className="text-sm text-green-700 mt-1 list-disc list-inside space-y-1">
                    <li>Keep it concise and actionable</li>
                    <li>Use clear, simple language</li>
                    <li>Include specific examples</li>
                    <li>Focus on one topic per tip</li>
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
