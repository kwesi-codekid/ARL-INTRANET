/**
 * Admin Create Safety Video Page
 * Task: 1.2.2.4.4 - Build video upload form with progress
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
  Progress,
} from "@heroui/react";
import { ArrowLeft, Save, Video, Upload } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, Link, redirect, useNavigation } from "react-router";
import type { SerializedSafetyCategory } from "~/lib/services/safety.server";

interface LoaderData {
  categories: SerializedSafetyCategory[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, createSafetyVideo, generateUniqueVideoSlug, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { uploadFile } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const categories = await getSafetyCategories(true);

  return Response.json({
    categories: categories.map(serializeSafetyCategory),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, createSafetyVideo, generateUniqueVideoSlug, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { uploadFile } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  const user = await requireAuth(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";
  const showInSlideshow = formData.get("showInSlideshow") === "true";
  const duration = parseInt(formData.get("duration") as string) || 0;

  // Handle video upload
  let videoUrl = "";
  const videoFile = formData.get("videoFile") as File;
  if (videoFile && videoFile.size > 0) {
    const uploadResult = await uploadFile(videoFile, "safety-videos");
    videoUrl = uploadResult.url;
  } else {
    // Use external URL if no file uploaded
    videoUrl = formData.get("videoUrl") as string;
  }

  // Handle thumbnail upload
  let thumbnail = "";
  const thumbnailFile = formData.get("thumbnail") as File;
  if (thumbnailFile && thumbnailFile.size > 0) {
    const uploadResult = await uploadFile(thumbnailFile, "safety-videos/thumbnails");
    thumbnail = uploadResult.url;
  }

  const slug = await generateUniqueVideoSlug(title);

  await createSafetyVideo({
    title,
    slug,
    description,
    videoUrl,
    thumbnail,
    duration,
    category,
    author: user._id.toString(),
    status,
    isFeatured,
    showInSlideshow,
  });

  return redirect("/admin/safety-videos");
}

export default function AdminCreateSafetyVideoPage() {
  const { categories } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isFeatured, setIsFeatured] = useState(false);
  const [showInSlideshow, setShowInSlideshow] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button as={Link} to="/admin/safety-videos" variant="light" isIconOnly>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Safety Video</h1>
          <p className="text-gray-500">Upload a new safety training video</p>
        </div>
      </div>

      <Form method="post" encType="multipart/form-data">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Video Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Title"
                  name="title"
                  isRequired
                  placeholder="e.g., Fire Safety Training"
                />

                <Textarea
                  label="Description"
                  name="description"
                  isRequired
                  placeholder="Describe what this video covers..."
                  minRows={4}
                />

                <Input
                  label="Duration (seconds)"
                  name="duration"
                  type="number"
                  placeholder="e.g., 300 for 5 minutes"
                  description="Video duration in seconds"
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex justify-between">
                <h2 className="font-semibold">Video Source</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={uploadMethod === "file" ? "solid" : "flat"}
                    color={uploadMethod === "file" ? "primary" : "default"}
                    onPress={() => setUploadMethod("file")}
                  >
                    Upload File
                  </Button>
                  <Button
                    size="sm"
                    variant={uploadMethod === "url" ? "solid" : "flat"}
                    color={uploadMethod === "url" ? "primary" : "default"}
                    onPress={() => setUploadMethod("url")}
                  >
                    External URL
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {uploadMethod === "file" ? (
                  <div className="space-y-4">
                    <Input
                      type="file"
                      name="videoFile"
                      accept="video/*"
                      description="Max file size: 100MB. Supported: MP4, WebM, MOV"
                      startContent={<Upload size={18} className="text-gray-400" />}
                    />
                    {isSubmitting && (
                      <Progress
                        size="sm"
                        isIndeterminate
                        color="primary"
                        label="Uploading..."
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    label="Video URL"
                    name="videoUrl"
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    description="Direct link to video file"
                  />
                )}
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Thumbnail</h2>
              </CardHeader>
              <CardBody>
                <Input
                  type="file"
                  name="thumbnail"
                  accept="image/*"
                  description="Recommended: 640x360 pixels (16:9 ratio)"
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
                  <span className="text-sm">Featured Video</span>
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
                    <p className="text-xs text-gray-500">Display this video in the main carousel</p>
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
                  color="primary"
                  fullWidth
                  startContent={<Save size={18} />}
                  isLoading={isSubmitting}
                >
                  Save Video
                </Button>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Category</h2>
              </CardHeader>
              <CardBody>
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
              </CardBody>
            </Card>

            {/* Tips */}
            <Card className="shadow-sm bg-blue-50 border-blue-200">
              <CardBody className="flex flex-row items-start gap-3">
                <Video size={24} className="text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800">Video Tips</h3>
                  <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                    <li>Use MP4 for best compatibility</li>
                    <li>Keep videos under 10 minutes</li>
                    <li>Add captions if possible</li>
                    <li>Use high-quality thumbnails</li>
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
