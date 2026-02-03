/**
 * Admin Gallery Creation Page
 * Task: 1.3.1.2.5 - Create new album
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
import { ArrowLeft, Save, ImagePlus, X, Camera, Calendar, ExternalLink, Link as LinkIcon } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form, Link, redirect } from "react-router";
import { requireAuth, getSessionData } from "~/lib/services/session.server";
import { connectDB } from "~/lib/db/connection.server";
import { Album } from "~/lib/db/models/gallery.server";
import { Event } from "~/lib/db/models/event.server";
import { uploadImage } from "~/lib/services/upload.server";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  await connectDB();

  // Get events for linking
  const events = await Event.find({ status: "published" })
    .sort({ date: -1 })
    .limit(50)
    .lean();

  return Response.json({
    events: events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      date: e.date?.toISOString(),
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const eventId = formData.get("event") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";
  const isExternalGallery = formData.get("isExternalGallery") === "true";
  const externalGalleryUrl = formData.get("externalGalleryUrl") as string;

  // Handle file upload
  let coverImage: string | null = null;
  const imageFile = formData.get("imageFile") as File | null;

  if (imageFile && imageFile.size > 0) {
    const imageResult = await uploadImage(imageFile, "gallery");
    if (imageResult.success && imageResult.url) {
      coverImage = imageResult.url;
    } else {
      return Response.json(
        { error: imageResult.error || "Failed to upload image" },
        { status: 400 }
      );
    }
  }

  // Validation
  if (!title || !date) {
    return Response.json(
      { error: "Title and date are required" },
      { status: 400 }
    );
  }

  // Generate unique slug
  let slug = generateSlug(title);
  const existingSlug = await Album.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  // Create album
  const album = await Album.create({
    title,
    slug,
    description: description || undefined,
    date: new Date(date),
    event: eventId || undefined,
    coverImage,
    status,
    isFeatured,
    isExternalGallery,
    externalGalleryUrl: isExternalGallery ? externalGalleryUrl : undefined,
    photoCount: 0,
    createdBy: sessionData?.userId,
  });

  // If external gallery, redirect to gallery list, otherwise to photos management
  if (isExternalGallery) {
    return redirect(`/admin/gallery?success=created`);
  }
  return redirect(`/admin/gallery/${album._id}/photos?success=created`);
}

export default function AdminGalleryNewPage() {
  const { events } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isFeatured, setIsFeatured] = useState(false);
  const [isExternalGallery, setIsExternalGallery] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/gallery"
          className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Album</h1>
          <p className="text-sm text-gray-500">Add a new photo album</p>
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
                <h2 className="font-semibold">Album Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Album Title"
                  placeholder="Enter album title"
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Camera size={16} className="text-gray-400" />}
                />

                <Textarea
                  name="description"
                  label="Description (Optional)"
                  placeholder="Brief description of the album"
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Input
                  name="date"
                  label="Album Date"
                  type="date"
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Calendar size={16} className="text-gray-400" />}
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Cover Image</h2>
              </CardHeader>
              <CardBody>
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
                    htmlFor="galleryCoverImage"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center py-6">
                      <ImagePlus size={40} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload cover image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  </label>
                )}
                {/* File input always rendered so form submission includes the file */}
                <input
                  ref={imageInputRef}
                  id="galleryCoverImage"
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="mt-2 text-xs text-gray-500">
                  You can also set a photo as cover after adding photos to the album.
                </p>
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
                  <span className="text-sm">Featured Album</span>
                  <Switch
                    isSelected={isFeatured}
                    onValueChange={setIsFeatured}
                    size="sm"
                  />
                </div>
                <input type="hidden" name="isFeatured" value={isFeatured.toString()} />

                <Divider />

                <Button
                  type="submit"
                  color="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  startContent={!isSubmitting && <Save size={16} />}
                >
                  Create & Add Photos
                </Button>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">External Gallery</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Use External Link</p>
                    <p className="text-xs text-gray-500">
                      Link to Google Drive, OneDrive, etc.
                    </p>
                  </div>
                  <Switch
                    isSelected={isExternalGallery}
                    onValueChange={setIsExternalGallery}
                    size="sm"
                  />
                </div>
                <input type="hidden" name="isExternalGallery" value={isExternalGallery.toString()} />

                {isExternalGallery && (
                  <Input
                    name="externalGalleryUrl"
                    label="Gallery URL"
                    placeholder="https://drive.google.com/..."
                    isRequired={isExternalGallery}
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    startContent={<LinkIcon size={16} className="text-gray-400" />}
                    description="Paste the shareable link to your photos"
                  />
                )}
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Link to Event</h2>
              </CardHeader>
              <CardBody>
                <Select
                  name="event"
                  label="Related Event (Optional)"
                  placeholder="Choose an event"
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  {events.map((event) => (
                    <SelectItem key={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-gray-500">
                  Link this album to an event to show it on the event page.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
