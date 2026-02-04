/**
 * Admin Gallery Edit Page
 * Task: 1.3.1.2.6 - Edit album
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
import { ArrowLeft, Save, ImagePlus, X, Camera, Calendar, Trash2, Images, ExternalLink, Link as LinkIcon } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useSearchParams, Form, Link, redirect } from "react-router";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Album } = await import("~/lib/db/models/gallery.server");
  const { Event } = await import("~/lib/db/models/event.server");

  await requireAuth(request);
  await connectDB();

  const album = await Album.findById(params.id).lean();

  if (!album) {
    throw new Response("Album not found", { status: 404 });
  }

  // Get events for linking
  const events = await Event.find({ status: "published" })
    .sort({ date: -1 })
    .limit(50)
    .lean();

  return Response.json({
    album: {
      id: album._id.toString(),
      title: album.title,
      slug: album.slug,
      description: album.description,
      date: album.date?.toISOString().split("T")[0],
      event: album.event?.toString(),
      coverImage: album.coverImage,
      photoCount: album.photoCount,
      status: album.status,
      isFeatured: album.isFeatured,
      isExternalGallery: album.isExternalGallery || false,
      externalGalleryUrl: album.externalGalleryUrl,
    },
    events: events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      date: e.date?.toISOString(),
    })),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Album, Photo } = await import("~/lib/db/models/gallery.server");
  const { uploadImage } = await import("~/lib/services/upload.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete
  if (intent === "delete") {
    await Photo.deleteMany({ album: params.id });
    await Album.findByIdAndDelete(params.id);
    return redirect("/admin/gallery?deleted=true");
  }

  // Handle update
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const eventId = formData.get("event") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";
  const isExternalGallery = formData.get("isExternalGallery") === "true";
  const externalGalleryUrl = formData.get("externalGalleryUrl") as string;

  // Handle file upload
  let coverImage: string | undefined;
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

  // Get current album
  const currentAlbum = await Album.findById(params.id);
  if (!currentAlbum) {
    return Response.json({ error: "Album not found" }, { status: 404 });
  }

  // Generate new slug if title changed
  let slug = currentAlbum.slug;
  if (title !== currentAlbum.title) {
    slug = generateSlug(title);
    const existingSlug = await Album.findOne({ slug, _id: { $ne: params.id } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // Update album
  const updateData: Record<string, unknown> = {
    title,
    slug,
    description: description || undefined,
    date: new Date(date),
    event: eventId || undefined,
    status,
    isFeatured,
    isExternalGallery,
    externalGalleryUrl: isExternalGallery ? externalGalleryUrl : undefined,
  };

  if (coverImage) {
    updateData.coverImage = coverImage;
  }

  await Album.findByIdAndUpdate(params.id, updateData);

  return redirect(`/admin/gallery/${params.id}/edit?success=updated`);
}

export default function AdminGalleryEditPage() {
  const { album, events } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const successMessage = searchParams.get("success");

  const [isFeatured, setIsFeatured] = useState(album.isFeatured);
  const [isExternalGallery, setIsExternalGallery] = useState(album.isExternalGallery);
  const [imagePreview, setImagePreview] = useState<string | null>(album.coverImage);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImagePreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this album and all its photos? This action cannot be undone.")) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/gallery"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Album</h1>
            <p className="text-sm text-gray-500">{album.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isExternalGallery && (
            <Button
              as={Link}
              to={`/admin/gallery/${album.id}/photos`}
              variant="flat"
              color="primary"
              startContent={<Images size={16} />}
            >
              Manage Photos ({album.photoCount})
            </Button>
          )}
          {isExternalGallery && album.externalGalleryUrl && (
            <Button
              as="a"
              href={album.externalGalleryUrl}
              target="_blank"
              variant="flat"
              color="secondary"
              startContent={<ExternalLink size={16} />}
            >
              View External Gallery
            </Button>
          )}
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

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          Album updated successfully!
        </div>
      )}

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
                  defaultValue={album.title}
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Camera size={16} className="text-gray-400" />}
                />

                <Textarea
                  name="description"
                  label="Description (Optional)"
                  placeholder="Brief description of the album"
                  defaultValue={album.description || ""}
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Input
                  name="date"
                  label="Album Date"
                  type="date"
                  defaultValue={album.date}
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
                    htmlFor="galleryEditCoverImage"
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
                  id="galleryEditCoverImage"
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
                <Select
                  name="status"
                  label="Status"
                  defaultSelectedKeys={[album.status]}
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
                  Update Album
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
                    defaultValue={album.externalGalleryUrl || ""}
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
                  defaultSelectedKeys={album.event ? [album.event] : undefined}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  {events.map((event) => (
                    <SelectItem key={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </Select>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Quick Actions</h2>
              </CardHeader>
              <CardBody className="space-y-2">
                {isExternalGallery && album.externalGalleryUrl ? (
                  <Button
                    as="a"
                    href={album.externalGalleryUrl}
                    target="_blank"
                    variant="flat"
                    fullWidth
                    startContent={<ExternalLink size={16} />}
                  >
                    View External Gallery
                  </Button>
                ) : (
                  <>
                    <Button
                      as="a"
                      href={`/gallery/${album.slug}`}
                      target="_blank"
                      variant="flat"
                      fullWidth
                    >
                      View Album Page
                    </Button>
                    <Button
                      as={Link}
                      to={`/admin/gallery/${album.id}/photos`}
                      variant="flat"
                      fullWidth
                      startContent={<Images size={16} />}
                    >
                      Manage Photos
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
