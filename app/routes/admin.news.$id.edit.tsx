/**
 * Admin News Edit Page
 * Task: 1.1.3.4.4
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
  Chip,
  Image,
} from "@heroui/react";
import { ArrowLeft, Save, Eye, Trash2, ImagePlus, X } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form, Link, redirect } from "react-router";
import { RichTextEditor } from "~/components/admin";

// Types for loader data
interface ArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  status: string;
  isFeatured: boolean;
  isPinned: boolean;
  views: number;
  createdAt: string | null;
  publishedAt: string | null;
}

interface CategoryData {
  id: string;
  name: string;
}

interface LoaderData {
  article: ArticleData;
  categories: CategoryData[];
  successMessage: string | null;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News, NewsCategory } = await import("~/lib/db/models/news.server");

  await requireAuth(request);
  await connectDB();

  const { id } = params;

  const article = await News.findById(id).lean();
  if (!article) {
    throw new Response("Article not found", { status: 404 });
  }

  const categories = await NewsCategory.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  const url = new URL(request.url);
  const success = url.searchParams.get("success");

  return Response.json({
    article: {
      id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      category: article.category.toString(),
      status: article.status,
      isFeatured: article.isFeatured,
      isPinned: article.isPinned,
      views: article.views,
      createdAt: article.createdAt?.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
    },
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
    })),
    successMessage: success === "created" ? "Article created successfully!" : null,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");
  const { uploadImage } = await import("~/lib/services/upload.server");

  await requireAuth(request);
  await connectDB();

  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await News.findByIdAndDelete(id);
    return redirect("/admin/news");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const categoryId = formData.get("category") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";
  const isPinned = formData.get("isPinned") === "true";
  const keepExistingImage = formData.get("keepExistingImage") === "true";

  // Validation
  if (!title || !content) {
    return Response.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  const article = await News.findById(id);
  if (!article) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  // Handle file upload
  let featuredImage = keepExistingImage ? article.featuredImage : undefined;
  const imageFile = formData.get("imageFile") as File | null;

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

  // Update article
  article.title = title;
  article.content = content;
  article.excerpt = excerpt || content.replace(/<[^>]*>/g, "").substring(0, 200);
  if (categoryId) {
    article.category = categoryId as any;
  } else {
    article.category = undefined;
  }
  article.featuredImage = featuredImage;
  article.isFeatured = isFeatured;
  article.isPinned = isPinned;

  // Handle status change
  if (status !== article.status) {
    article.status = status;
    if (status === "published" && !article.publishedAt) {
      article.publishedAt = new Date();
    }
  }

  await article.save();

  return Response.json({ success: true, message: "Article updated successfully!" });
}

export default function AdminNewsEditPage() {
  const { article, categories, successMessage } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success?: boolean; message?: string; error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isFeatured, setIsFeatured] = useState(article.isFeatured);
  const [isPinned, setIsPinned] = useState(article.isPinned);
  const [imagePreview, setImagePreview] = useState<string | null>(article.featuredImage || null);
  const [keepExistingImage, setKeepExistingImage] = useState(!!article.featuredImage);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        setKeepExistingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setKeepExistingImage(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/news"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
            <p className="text-sm text-gray-500">
              {article.views} views • Created {formatDate(article.createdAt)}
            </p>
          </div>
        </div>
        <Button
          as={Link}
          to={`/news/${article.slug}`}
          target="_blank"
          variant="flat"
          startContent={<Eye size={16} />}
        >
          Preview
        </Button>
      </div>

      {(successMessage || actionData?.success) && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {successMessage || actionData?.message}
        </div>
      )}

      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      <Form method="post" encType="multipart/form-data">
        <input type="hidden" name="keepExistingImage" value={keepExistingImage.toString()} />

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
                  defaultValue={article.title}
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Textarea
                  name="excerpt"
                  label="Excerpt"
                  placeholder="Brief summary of the article (optional)"
                  defaultValue={article.excerpt}
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <RichTextEditor
                  name="content"
                  label="Content"
                  placeholder="Write your article content here..."
                  initialContent={article.content}
                  isRequired
                  minHeight="300px"
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Featured Image</h2>
              </CardHeader>
              <CardBody>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      className="absolute top-2 right-2"
                      onPress={removeImage}
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
                <input
                  ref={imageInputRef}
                  id="imageFile"
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Current Status:</span>
                  <Chip
                    size="sm"
                    color={article.status === "published" ? "success" : "warning"}
                    variant="flat"
                  >
                    {article.status}
                  </Chip>
                </div>

                <Select
                  name="status"
                  label="Status"
                  defaultSelectedKeys={[article.status]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                  <SelectItem key="archived">Archived</SelectItem>
                </Select>

                {article.publishedAt && (
                  <p className="text-xs text-gray-500">
                    Published: {formatDate(article.publishedAt)}
                  </p>
                )}

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

                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                  startContent={!isSubmitting && <Save size={16} />}
                >
                  Update Article
                </Button>
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
                  defaultSelectedKeys={article.category ? [article.category] : undefined}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>
              </CardBody>
            </Card>

            <Card className="shadow-sm border-red-200">
              <CardHeader>
                <h2 className="font-semibold text-red-600">Danger Zone</h2>
              </CardHeader>
              <CardBody>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <Button
                    type="submit"
                    color="danger"
                    variant="flat"
                    className="w-full"
                    startContent={<Trash2 size={16} />}
                    onPress={(e) => {
                      if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Delete Article
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
