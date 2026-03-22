/**
 * Admin Edit Safety Video Page
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
import type { SerializedSafetyCategory, SerializedSafetyVideo } from "~/lib/services/safety.server";

interface LoaderData {
  video: SerializedSafetyVideo;
  categories: SerializedSafetyCategory[];
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, getSafetyVideoById, updateSafetyVideo, serializeSafetyCategory, serializeSafetyVideo } = await import("~/lib/services/safety.server");
  const { uploadFile } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const video = await getSafetyVideoById(params.id!);
  if (!video) {
    throw new Response("Video not found", { status: 404 });
  }

  const categories = await getSafetyCategories(true);

  return Response.json({
    video: serializeSafetyVideo(video),
    categories: categories.map(serializeSafetyCategory),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, getSafetyVideoById, updateSafetyVideo, serializeSafetyCategory, serializeSafetyVideo } = await import("~/lib/services/safety.server");
  const { uploadFile } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";
  const showInSlideshow = formData.get("showInSlideshow") === "true";
  const duration = parseInt(formData.get("duration") as string) || 0;

  // Handle video upload (if new file provided)
  let videoUrl: string | undefined;
  const videoFile = formData.get("videoFile") as File;
  if (videoFile && videoFile.size > 0) {
    const uploadResult = await uploadFile(videoFile, "safety-videos");
    videoUrl = uploadResult.url;
  } else {
    // Use external URL if provided
    const externalUrl = formData.get("videoUrl") as string;
    if (externalUrl) {
      videoUrl = externalUrl;
    }
  }

  // Handle thumbnail upload (if new file provided)
  let thumbnail: string | undefined;
  const thumbnailFile = formData.get("thumbnail") as File;
  if (thumbnailFile && thumbnailFile.size > 0) {
    const uploadResult = await uploadFile(thumbnailFile, "safety-videos/thumbnails");
    thumbnail = uploadResult.url;
  }

  const updateData: Record<string, unknown> = {
    title,
    description,
    category,
    status,
    isFeatured,
    showInSlideshow,
    duration,
  };

  // Only update videoUrl if a new one was provided
  if (videoUrl) {
    updateData.videoUrl = videoUrl;
  }

  // Only update thumbnail if a new one was provided
  if (thumbnail) {
    updateData.thumbnail = thumbnail;
  }

  await updateSafetyVideo(params.id!, updateData);

  return redirect("/admin/safety-videos");
}

export default function AdminEditSafetyVideoPage() {
  const { video, categories } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isFeatured, setIsFeatured] = useState(video.isFeatured);
  const [showInSlideshow, setShowInSlideshow] = useState(video.showInSlideshow);
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("url");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button as={Link} to="/admin/safety-videos" variant="light" isIconOnly>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Safety Video</h1>
          <p className="text-gray-500">Update video details</p>
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
                  defaultValue={video.title}
                  placeholder="e.g., Fire Safety Training"
                />

                <Textarea
                  label="Description"
                  name="description"
                  isRequired
                  defaultValue={video.description}
                  placeholder="Describe what this video covers..."
                  minRows={4}
                />

                <Input
                  label="Duration (seconds)"
                  name="duration"
                  type="number"
                  defaultValue={video.duration?.toString() || ""}
                  placeholder="e.g., 300 for 5 minutes"
                  description="Video duration in seconds"
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <h2 className="font-semibold">Video Source</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={uploadMethod === "file" ? "solid" : "flat"}
                    color={uploadMethod === "file" ? "primary" : "default"}
                    onPress={() => setUploadMethod("file")}
                  >
                    Upload New File
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
                {/* Show current video */}
                {video.videoUrl && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Current video:</p>
                    <p className="text-sm font-mono truncate">{video.videoUrl}</p>
                  </div>
                )}

                {uploadMethod === "file" ? (
                  <div className="space-y-4">
                    <Input
                      type="file"
                      name="videoFile"
                      accept="video/*"
                      description="Max file size: 100MB. Supported: MP4, WebM, MOV. Leave empty to keep current video."
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
                    defaultValue={video.videoUrl}
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
                {/* Show current thumbnail */}
                {video.thumbnail && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Current thumbnail:</p>
                    <img
                      src={video.thumbnail}
                      alt="Current thumbnail"
                      className="w-40 h-24 object-cover rounded"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  name="thumbnail"
                  accept="image/*"
                  description="Recommended: 640x360 pixels (16:9 ratio). Leave empty to keep current."
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
                  defaultSelectedKeys={[video.status]}
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
                  Save Changes
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
                  defaultSelectedKeys={video.category ? [video.category.id] : []}
                  placeholder="Select a category"
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>
              </CardBody>
            </Card>

            {/* Video Info */}
            <Card className="shadow-sm bg-gray-50">
              <CardBody className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Views:</span>
                  <span className="font-medium">{video.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
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
