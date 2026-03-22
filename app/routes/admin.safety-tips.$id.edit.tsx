/**
 * Admin Edit Safety Tip Page
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
import type { SerializedSafetyCategory, SerializedSafetyTip } from "~/lib/services/safety.server";

interface LoaderData {
  tip: SerializedSafetyTip;
  categories: SerializedSafetyCategory[];
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, getSafetyTipById, updateSafetyTip, serializeSafetyCategory, serializeSafetyTip } = await import("~/lib/services/safety.server");
  const { uploadFile, uploadDocument } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const tip = await getSafetyTipById(params.id!);
  if (!tip) {
    throw new Response("Safety tip not found", { status: 404 });
  }

  const categories = await getSafetyCategories(true);

  return Response.json({
    tip: serializeSafetyTip(tip),
    categories: categories.map(serializeSafetyCategory),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, getSafetyTipById, updateSafetyTip, serializeSafetyCategory, serializeSafetyTip } = await import("~/lib/services/safety.server");
  const { uploadFile, uploadDocument } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
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

  const updateData: Record<string, unknown> = {
    title,
    content,
    summary,
    category,
    status,
    isFeatured,
    showInSlideshow,
    icon,
  };

  // Handle image upload (if new file provided)
  const imageFile = formData.get("featuredImage") as File;
  if (imageFile && imageFile.size > 0) {
    const uploadResult = await uploadFile(imageFile, "safety-tips");
    updateData.featuredImage = uploadResult.url;
  }

  // Handle PDF document upload (if new file provided)
  const documentFile = formData.get("document") as File;
  if (documentFile && documentFile.size > 0) {
    const docResult = await uploadDocument(documentFile, "safety-documents");
    updateData.documentUrl = docResult.url;
  }

  await updateSafetyTip(params.id!, updateData);

  return redirect("/admin/safety-tips");
}

export default function AdminEditSafetyTipPage() {
  const { tip, categories } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isFeatured, setIsFeatured] = useState(tip.isFeatured);
  const [showInSlideshow, setShowInSlideshow] = useState(tip.showInSlideshow);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button as={Link} to="/admin/safety-tips" variant="light" isIconOnly>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Safety Tip</h1>
          <p className="text-gray-500">Update safety tip details</p>
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
                  defaultValue={tip.title}
                  placeholder="e.g., Always Wear Your PPE"
                />

                <Textarea
                  label="Summary"
                  name="summary"
                  defaultValue={tip.summary}
                  placeholder="Brief summary of the safety tip"
                  maxLength={300}
                  description="Max 300 characters"
                  minRows={2}
                />

                <RichTextEditor
                  name="content"
                  label="Content"
                  defaultValue={tip.content}
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
                {/* Show current image */}
                {tip.featuredImage && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Current image:</p>
                    <img
                      src={tip.featuredImage}
                      alt="Current featured"
                      className="w-40 h-24 object-cover rounded"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  name="featuredImage"
                  accept="image/*"
                  description="Recommended size: 800x400 pixels. Leave empty to keep current."
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">PDF Document (Optional)</h2>
              </CardHeader>
              <CardBody>
                {/* Show current document */}
                {tip.documentUrl && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Current document:</p>
                    <a
                      href={tip.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View current PDF
                    </a>
                  </div>
                )}
                <Input
                  type="file"
                  name="document"
                  accept=".pdf,application/pdf"
                  description="Upload a new PDF document. Leave empty to keep current."
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
                  defaultSelectedKeys={[tip.status]}
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
                  Save Changes
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
                  defaultSelectedKeys={tip.category ? [tip.category.id] : []}
                  placeholder="Select a category"
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>

                <Input
                  label="Icon"
                  name="icon"
                  defaultValue={tip.icon}
                  placeholder="e.g., shield, hard-hat"
                  description="Lucide icon name"
                />
              </CardBody>
            </Card>

            {/* Tip Info */}
            <Card className="shadow-sm bg-gray-50">
              <CardBody className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Views:</span>
                  <span className="font-medium">{tip.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </span>
                </div>
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
