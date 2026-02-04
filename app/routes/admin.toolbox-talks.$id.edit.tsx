/**
 * Admin Toolbox Talk Edit Page
 * Task: 1.2.1.4.5
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Button,
  Select,
  SelectItem,
  Chip,
  Divider,
} from "@heroui/react";
import { ArrowLeft, Save, Calendar, Trash2, Video, Volume2, Image as ImageIcon, Eye } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useSearchParams, Form, Link, redirect } from "react-router";
import { RichTextEditor } from "~/components/admin";

interface EditLoaderData {
  talk: {
    id: string;
    title: string;
    slug: string;
    content: string;
    summary: string;
    scheduledDate: string;
    status: string;
    tags: string[];
    featuredMedia: { type: string; url: string } | null;
    media: Array<{ type: string; url: string }>;
    views: number;
  };
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getToolboxTalkById, serializeToolboxTalk } = await import("~/lib/services/toolbox-talk.server");

  await requireAuth(request);
  await connectDB();

  const talk = await getToolboxTalkById(params.id!);

  if (!talk) {
    throw new Response("Not Found", { status: 404 });
  }

  // Serialize and format for edit form
  const serialized = serializeToolboxTalk(talk);

  const data: EditLoaderData = {
    talk: {
      id: serialized.id,
      title: serialized.title,
      slug: serialized.slug,
      content: serialized.content,
      summary: serialized.summary || "",
      scheduledDate: serialized.scheduledDate.split("T")[0],
      status: serialized.status,
      tags: serialized.tags || [],
      featuredMedia: serialized.featuredMedia,
      media: serialized.media || [],
      views: serialized.views,
    },
  };

  return Response.json(data);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { updateToolboxTalk, deleteToolboxTalk } = await import("~/lib/services/toolbox-talk.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete using service
  if (intent === "delete") {
    const deleted = await deleteToolboxTalk(params.id!);
    if (deleted) {
      return redirect("/admin/toolbox-talks?deleted=true");
    }
    return Response.json({ error: "Failed to delete" }, { status: 400 });
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const summary = formData.get("summary") as string;
  const scheduledDate = formData.get("scheduledDate") as string;
  const status = formData.get("status") as "draft" | "published" | "archived";
  const tagsStr = formData.get("tags") as string;
  const featuredMediaUrl = formData.get("featuredMediaUrl") as string;
  const featuredMediaType = formData.get("featuredMediaType") as "image" | "video" | "audio" | "";

  // Validation
  if (!title || !content || !scheduledDate) {
    return Response.json(
      { error: "Title, content, and scheduled date are required" },
      { status: 400 }
    );
  }

  // Parse tags
  const tags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Build featured media object if provided
  const featuredMedia = featuredMediaUrl && featuredMediaType
    ? { type: featuredMediaType, url: featuredMediaUrl }
    : undefined;

  // Update toolbox talk using service
  const updated = await updateToolboxTalk(params.id!, {
    title,
    content,
    summary: summary || content.substring(0, 200),
    scheduledDate: new Date(scheduledDate),
    status,
    tags,
    featuredMedia,
  });

  if (!updated) {
    return Response.json({ error: "Failed to update talk" }, { status: 400 });
  }

  return Response.json({ success: true, message: "Talk updated successfully" });
}

export default function AdminToolboxTalkEditPage() {
  const { talk } = useLoaderData<EditLoaderData>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const [tags, setTags] = useState<string[]>(talk.tags);
  const [tagInput, setTagInput] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "">(
    talk.featuredMedia?.type || ""
  );

  // Show success message on URL param
  useEffect(() => {
    if (searchParams.get("success") === "created") {
      // Could show a toast here if addToast is available
    }
  }, [searchParams]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this toolbox talk? This action cannot be undone.")) {
      const form = document.createElement("form");
      form.method = "post";
      form.innerHTML = `<input type="hidden" name="intent" value="delete" />`;
      document.body.appendChild(form);
      form.submit();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/toolbox-talks"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Toolbox Talk</h1>
            <p className="text-sm text-gray-500">{talk.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            as={Link}
            to={`/toolbox-talk/${talk.slug}`}
            target="_blank"
            variant="flat"
            startContent={<Eye size={16} />}
          >
            View
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 size={16} />}
            onPress={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
        </div>
      )}

      <Form method="post">
        <input type="hidden" name="tags" value={tags.join(",")} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Talk Content</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Title"
                  placeholder="Enter talk title"
                  defaultValue={talk.title}
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Textarea
                  name="summary"
                  label="Summary"
                  placeholder="Brief summary of the talk (optional)"
                  defaultValue={talk.summary}
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <RichTextEditor
                  name="content"
                  label="Content"
                  placeholder="Write your toolbox talk content here..."
                  initialContent={talk.content}
                  isRequired
                  minHeight="250px"
                />
              </CardBody>
            </Card>

            {/* Media Upload */}
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Featured Media</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={mediaType === "image" ? "solid" : "flat"}
                    color={mediaType === "image" ? "primary" : "default"}
                    startContent={<ImageIcon size={16} />}
                    onPress={() => setMediaType(mediaType === "image" ? "" : "image")}
                    size="sm"
                  >
                    Image
                  </Button>
                  <Button
                    variant={mediaType === "video" ? "solid" : "flat"}
                    color={mediaType === "video" ? "primary" : "default"}
                    startContent={<Video size={16} />}
                    onPress={() => setMediaType(mediaType === "video" ? "" : "video")}
                    size="sm"
                  >
                    Video
                  </Button>
                  <Button
                    variant={mediaType === "audio" ? "solid" : "flat"}
                    color={mediaType === "audio" ? "primary" : "default"}
                    startContent={<Volume2 size={16} />}
                    onPress={() => setMediaType(mediaType === "audio" ? "" : "audio")}
                    size="sm"
                  >
                    Audio
                  </Button>
                </div>

                {mediaType && (
                  <>
                    <input type="hidden" name="featuredMediaType" value={mediaType} />
                    <Input
                      name="featuredMediaUrl"
                      label={`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} URL`}
                      defaultValue={talk.featuredMedia?.url || ""}
                      placeholder={
                        mediaType === "video"
                          ? "https://example.com/video.mp4"
                          : mediaType === "audio"
                            ? "https://example.com/audio.mp3"
                            : "https://example.com/image.jpg"
                      }
                      description={`Enter the URL of the ${mediaType} file`}
                      classNames={{ inputWrapper: "bg-gray-50" }}
                    />
                  </>
                )}

                {!mediaType && talk.featuredMedia && (
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    Current media will be removed. Select a type to keep or replace it.
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Tags */}
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Tags</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onValueChange={setTagInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag (press Enter)"
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    className="flex-1"
                  />
                  <Button onPress={addTag} isDisabled={!tagInput.trim()}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        onClose={() => removeTag(tag)}
                        variant="flat"
                        color="warning"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Schedule & Status</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="scheduledDate"
                  label="Scheduled Date"
                  type="date"
                  defaultValue={talk.scheduledDate}
                  isRequired
                  startContent={<Calendar size={16} className="text-gray-400" />}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Select
                  name="status"
                  label="Status"
                  defaultSelectedKeys={[talk.status]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                  <SelectItem key="archived">Archived</SelectItem>
                </Select>

                <Divider />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    color="primary"
                    className="flex-1"
                    isLoading={isSubmitting}
                    startContent={!isSubmitting && <Save size={16} />}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Statistics</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{talk.views}</p>
                    <p className="text-sm text-gray-500">Views</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{talk.media?.length || 0}</p>
                    <p className="text-sm text-gray-500">Media Files</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
