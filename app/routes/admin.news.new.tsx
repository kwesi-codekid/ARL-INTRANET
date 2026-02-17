/**
 * Admin News Creation Page
 * Task: 1.1.3.4.2
 */

import { useState, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Button,
  Select,
  SelectItem,
  Switch,
  Divider,
  Image,
} from "@heroui/react";
import { ArrowLeft, Save, Eye, ImagePlus, Upload, X, Video } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form, Link, redirect } from "react-router";
import { RichTextEditor } from "~/components/admin";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { NewsCategory } = await import("~/lib/db/models/news.server");

  await requireAuth(request);
  await connectDB();

  const categories = await NewsCategory.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  return Response.json({
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");
  const { uploadImage, uploadVideo } = await import("~/lib/services/upload.server");

  const user = await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const categoryId = formData.get("category") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";
  const isPinned = formData.get("isPinned") === "true";

  // Handle file uploads
  let featuredImage: string | null = null;
  let featuredVideo: string | null = null;

  const imageFile = formData.get("imageFile") as File | null;
  const videoFile = formData.get("videoFile") as File | null;

  // Upload image if provided
  if (imageFile && imageFile.size > 0) {
    const imageResult = await uploadImage(imageFile, "news");
    if (imageResult.success && imageResult.url) {
      featuredImage = imageResult.url;
    } else {
      return Response.json(
        { error: imageResult.error || "Failed to upload image" },
        { status: 400 }
      );
    }
  }

  // Upload video if provided
  if (videoFile && videoFile.size > 0) {
    const videoResult = await uploadVideo(videoFile, "news");
    if (videoResult.success && videoResult.url) {
      featuredVideo = videoResult.url;
    } else {
      return Response.json(
        { error: videoResult.error || "Failed to upload video" },
        { status: 400 }
      );
    }
  }

  // Validation
  if (!title || !content) {
    return Response.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  // Generate unique slug
  let slug = generateSlug(title);
  const existingSlug = await News.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  // Create news
  const news = await News.create({
    title,
    slug,
    content,
    excerpt: excerpt || content.substring(0, 200),
    category: categoryId || undefined,
    author: sessionData?.userId,
    featuredImage,
    featuredVideo,
    status,
    isFeatured,
    isPinned,
    publishedAt: status === "published" ? new Date() : null,
  });

  if (status === "published") {
    const { sendPushNotificationToAll } = await import("~/lib/services/push-notification.server");
    sendPushNotificationToAll({
      title: "New Article: " + title,
      body: excerpt || content.substring(0, 120),
      url: "/news/" + slug,
    });
  }

  return redirect(`/admin/news/${news._id}/edit?success=created`);
}

export default function AdminNewsNewPage() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/news"
          className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Article</h1>
          <p className="text-sm text-gray-500">Add a new news article</p>
        </div>
      </div>

      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      <Form method="post" encType="multipart/form-data">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Article Content</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Title"
                  placeholder="Enter article title"
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Textarea
                  name="excerpt"
                  label="Excerpt"
                  placeholder="Brief summary of the article (optional)"
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <RichTextEditor
                  name="content"
                  label="Content"
                  placeholder="Write your article content here..."
                  isRequired
                  minHeight="300px"
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Featured Media</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image
                  </label>
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        className="absolute top-2 right-2"
                        onPress={() => {
                          setImagePreview(null);
                          if (imageInputRef.current) imageInputRef.current.value = "";
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="imageFile"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center py-6">
                        <ImagePlus size={40} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </label>
                  )}
                  {/* File input always rendered so form submission includes the file */}
                  <input
                    ref={imageInputRef}
                    id="imageFile"
                    type="file"
                    name="imageFile"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Video (Optional)
                  </label>
                  {videoPreview ? (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        className="absolute top-2 right-2"
                        onPress={() => {
                          setVideoPreview(null);
                          if (videoInputRef.current) videoInputRef.current.value = "";
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="videoFile"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center py-4">
                        <Video size={32} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload video</p>
                        <p className="text-xs text-gray-400 mt-1">MP4, WebM up to 100MB</p>
                      </div>
                    </label>
                  )}
                  {/* File input always rendered so form submission includes the file */}
                  <input
                    ref={videoInputRef}
                    id="videoFile"
                    type="file"
                    name="videoFile"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoChange}
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Publish</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  name="status"
                  label="Status"
                  defaultSelectedKeys={["draft"]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                </Select>

                <Divider />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Featured Article</span>
                  <Switch
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                    size="sm"
                  />
                </div>
                <input type="hidden" name="isFeatured" value={isFeatured.toString()} />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Pin to Top</span>
                  <Switch
                    isSelected={isPinned}
                    onValueChange={setIsPinned}
                    size="sm"
                  />
                </div>
                <input type="hidden" name="isPinned" value={isPinned.toString()} />

                <Divider />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    color="primary"
                    className="flex-1"
                    isLoading={isSubmitting}
                    startContent={!isSubmitting && <Save size={16} />}
                  >
                    Save
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Category</h2>
              </CardHeader>
              <CardBody>
                <Select
                  name="category"
                  label="Select Category"
                  placeholder="Choose a category"
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
