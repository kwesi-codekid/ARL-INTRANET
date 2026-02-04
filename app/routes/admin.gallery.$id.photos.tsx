/**
 * Admin Photos Management Page (Batch Upload & Reordering)
 * Task: 1.3.1.2.7 - Manage photos with batch upload
 * Task: 1.3.1.5.6 - Implement drag-and-drop photo reordering
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Image,
  Input,
  Progress,
  Chip,
} from "@heroui/react";
import { ArrowLeft, Upload, X, Trash2, Star, GripVertical, Edit2, Save } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useSearchParams, Form, Link, useRevalidator } from "react-router";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { uploadImage } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Album, Photo } = await import("~/lib/db/models/gallery.server");

  await requireAuth(request);
  await connectDB();

  const album = await Album.findById(params.id).lean();

  if (!album) {
    throw new Response("Album not found", { status: 404 });
  }

  const photos = await Photo.find({ album: params.id })
    .sort({ order: 1 })
    .lean();

  return Response.json({
    album: {
      id: album._id.toString(),
      title: album.title,
      slug: album.slug,
      coverImage: album.coverImage,
      photoCount: album.photoCount,
    },
    photos: photos.map((p) => ({
      id: p._id.toString(),
      url: p.url,
      thumbnail: p.thumbnail,
      caption: p.caption,
      order: p.order,
    })),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { uploadImage } = await import("~/lib/services/upload.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Album, Photo } = await import("~/lib/db/models/gallery.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle batch upload
  if (intent === "upload") {
    const files = formData.getAll("files") as File[];
    const uploadedPhotos = [];

    // Get current max order
    const maxOrderPhoto = await Photo.findOne({ album: params.id })
      .sort({ order: -1 })
      .lean();
    let currentOrder = maxOrderPhoto ? maxOrderPhoto.order + 1 : 0;

    for (const file of files) {
      if (file.size > 0) {
        const result = await uploadImage(file, "gallery");
        if (result.success && result.url) {
          const photo = await Photo.create({
            album: params.id,
            url: result.url,
            thumbnail: result.url, // Could generate thumbnail in future
            order: currentOrder++,
          });
          uploadedPhotos.push(photo);
        }
      }
    }

    // Update album photo count
    const photoCount = await Photo.countDocuments({ album: params.id });
    await Album.findByIdAndUpdate(params.id, { photoCount });

    // If no cover image, set first uploaded photo as cover
    const album = await Album.findById(params.id);
    if (!album?.coverImage && uploadedPhotos.length > 0) {
      await Album.findByIdAndUpdate(params.id, {
        coverImage: uploadedPhotos[0].url,
      });
    }

    return Response.json({
      success: true,
      message: `${uploadedPhotos.length} photos uploaded`,
      uploadedCount: uploadedPhotos.length,
    });
  }

  // Handle single photo delete
  if (intent === "delete-photo") {
    const photoId = formData.get("photoId") as string;
    await Photo.findByIdAndDelete(photoId);

    // Update album photo count
    const photoCount = await Photo.countDocuments({ album: params.id });
    await Album.findByIdAndUpdate(params.id, { photoCount });

    return Response.json({ success: true, message: "Photo deleted" });
  }

  // Handle set as cover
  if (intent === "set-cover") {
    const photoUrl = formData.get("photoUrl") as string;
    await Album.findByIdAndUpdate(params.id, { coverImage: photoUrl });
    return Response.json({ success: true, message: "Cover image updated" });
  }

  // Handle update caption
  if (intent === "update-caption") {
    const photoId = formData.get("photoId") as string;
    const caption = formData.get("caption") as string;
    await Photo.findByIdAndUpdate(photoId, { caption });
    return Response.json({ success: true, message: "Caption updated" });
  }

  // Handle delete all photos
  if (intent === "delete-all") {
    await Photo.deleteMany({ album: params.id });
    await Album.findByIdAndUpdate(params.id, { photoCount: 0, coverImage: null });
    return Response.json({ success: true, message: "All photos deleted" });
  }

  // Handle photo reordering
  if (intent === "reorder") {
    const orderData = formData.get("orderData") as string;
    try {
      const photoOrders: { id: string; order: number }[] = JSON.parse(orderData);

      // Update each photo's order in bulk
      const bulkOps = photoOrders.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: id, album: params.id },
          update: { $set: { order } },
        },
      }));

      await Photo.bulkWrite(bulkOps);
      return Response.json({ success: true, message: "Photo order updated" });
    } catch (error) {
      return Response.json({ error: "Failed to reorder photos" }, { status: 400 });
    }
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

// Sortable Photo Item Component
interface SortablePhotoProps {
  photo: {
    id: string;
    url: string;
    thumbnail?: string;
    caption?: string;
    order: number;
  };
  albumCoverImage?: string;
  onSetCover: (url: string) => void;
  onDelete: (id: string) => void;
  onEditCaption: (id: string, caption: string) => void;
  editingCaption: string | null;
  captionValue: string;
  onCaptionChange: (value: string) => void;
  onSaveCaption: (id: string) => void;
}

function SortablePhotoItem({
  photo,
  albumCoverImage,
  onSetCover,
  onDelete,
  onEditCaption,
  editingCaption,
  captionValue,
  onCaptionChange,
  onSaveCaption,
}: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${
        isDragging ? "ring-2 ring-primary-500 shadow-lg" : ""
      }`}
    >
      <img
        src={photo.thumbnail || photo.url}
        alt={photo.caption || "Photo"}
        className="w-full h-full object-cover"
      />

      {/* Cover badge */}
      {albumCoverImage === photo.url && (
        <div className="absolute top-2 left-2">
          <Chip size="sm" color="warning" variant="solid">
            <Star size={12} className="mr-1" /> Cover
          </Chip>
        </div>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 rounded bg-black/50 text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pt-10">
        <div className="flex justify-end gap-1">
          {albumCoverImage !== photo.url && (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="bg-white/20 text-white"
              onPress={() => onSetCover(photo.url)}
              title="Set as cover"
            >
              <Star size={14} />
            </Button>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-white/20 text-white"
            onPress={() => onEditCaption(photo.id, photo.caption || "")}
            title="Edit caption"
          >
            <Edit2 size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            color="danger"
            variant="flat"
            className="bg-white/20"
            onPress={() => onDelete(photo.id)}
            title="Delete"
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Caption edit */}
        {editingCaption === photo.id ? (
          <div className="flex gap-1">
            <Input
              size="sm"
              value={captionValue}
              onValueChange={onCaptionChange}
              placeholder="Add caption..."
              classNames={{
                inputWrapper: "bg-white/90 min-h-unit-8",
                input: "text-xs",
              }}
            />
            <Button
              isIconOnly
              size="sm"
              color="primary"
              onPress={() => onSaveCaption(photo.id)}
            >
              <Save size={14} />
            </Button>
          </div>
        ) : photo.caption ? (
          <p className="text-white text-xs truncate">{photo.caption}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminGalleryPhotosPage() {
  const { album, photos: initialPhotos } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state === "submitting";
  const successMessage = searchParams.get("success");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop state
  const [photos, setPhotos] = useState(initialPhotos);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Update local photos when loader data changes
  useEffect(() => {
    setPhotos(initialPhotos);
    setHasOrderChanged(false);
  }, [initialPhotos]);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasOrderChanged(true);
    }
  }, []);

  // Save new order to server
  const savePhotoOrder = async () => {
    setIsSavingOrder(true);

    const orderData = photos.map((photo, index) => ({
      id: photo.id,
      order: index,
    }));

    const formData = new FormData();
    formData.append("intent", "reorder");
    formData.append("orderData", JSON.stringify(orderData));

    try {
      const response = await fetch(`/admin/gallery/${album.id}/photos`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setHasOrderChanged(false);
        revalidator.revalidate();
      }
    } catch (error) {
      console.error("Failed to save order:", error);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Reset order to original
  const resetOrder = () => {
    setPhotos(initialPhotos);
    setHasOrderChanged(false);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    // Generate previews
    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push(event.target?.result as string);
        if (newPreviews.length === files.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("intent", "upload");
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`/admin/gallery/${album.id}/photos`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSelectedFiles([]);
        setPreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        revalidator.revalidate();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      const form = document.createElement("form");
      form.method = "post";
      form.innerHTML = `
        <input type="hidden" name="intent" value="delete-photo" />
        <input type="hidden" name="photoId" value="${photoId}" />
      `;
      document.body.appendChild(form);
      form.submit();
    }
  };

  const handleSetCover = (photoUrl: string) => {
    const form = document.createElement("form");
    form.method = "post";
    form.innerHTML = `
      <input type="hidden" name="intent" value="set-cover" />
      <input type="hidden" name="photoUrl" value="${photoUrl}" />
    `;
    document.body.appendChild(form);
    form.submit();
  };

  const handleDeleteAll = () => {
    if (confirm("Are you sure you want to delete ALL photos in this album? This cannot be undone.")) {
      const form = document.createElement("form");
      form.method = "post";
      form.innerHTML = `<input type="hidden" name="intent" value="delete-all" />`;
      document.body.appendChild(form);
      form.submit();
    }
  };

  const startEditCaption = (photoId: string, currentCaption: string) => {
    setEditingCaption(photoId);
    setCaptionValue(currentCaption || "");
  };

  const saveCaption = (photoId: string) => {
    const form = document.createElement("form");
    form.method = "post";
    form.innerHTML = `
      <input type="hidden" name="intent" value="update-caption" />
      <input type="hidden" name="photoId" value="${photoId}" />
      <input type="hidden" name="caption" value="${captionValue}" />
    `;
    document.body.appendChild(form);
    form.submit();
    setEditingCaption(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/gallery/${album.id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Photos</h1>
            <p className="text-sm text-gray-500">{album.title} - {photos.length} photos</p>
          </div>
        </div>
        {photos.length > 0 && (
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 size={16} />}
            onPress={handleDeleteAll}
          >
            Delete All
          </Button>
        )}
      </div>

      {successMessage === "created" && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          Album created! Now add some photos below.
        </div>
      )}

      {actionData?.message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
        </div>
      )}

      {/* Upload Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <h2 className="font-semibold">Upload Photos</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Dropzone */}
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <div className="flex flex-col items-center justify-center py-6">
              <Upload size={40} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Click to select photos or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF up to 5MB each. Select multiple files.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {selectedFiles.length} files selected
                </p>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    setSelectedFiles([]);
                    setPreviews([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Clear
                </Button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {isUploading && (
                <Progress
                  size="sm"
                  isIndeterminate
                  aria-label="Uploading..."
                  className="max-w-full"
                />
              )}

              <Button
                color="primary"
                startContent={<Upload size={16} />}
                onPress={handleUpload}
                isLoading={isUploading}
                isDisabled={isUploading}
              >
                Upload {selectedFiles.length} Photos
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Photos Grid */}
      <Card className="shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Album Photos</h2>
            <Chip size="sm" variant="flat">
              {photos.length} photos
            </Chip>
          </div>
          {hasOrderChanged && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600">Unsaved changes</span>
              <Button
                size="sm"
                variant="flat"
                onPress={resetOrder}
                isDisabled={isSavingOrder}
              >
                Reset
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={savePhotoOrder}
                isLoading={isSavingOrder}
              >
                Save Order
              </Button>
            </div>
          )}
        </CardHeader>
        <CardBody>
          {photos.length > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-4">
                <GripVertical size={14} className="inline mr-1" />
                Drag photos to reorder them. Click Save Order when done.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={photos.map((p) => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {photos.map((photo) => (
                      <SortablePhotoItem
                        key={photo.id}
                        photo={photo}
                        albumCoverImage={album.coverImage}
                        onSetCover={handleSetCover}
                        onDelete={handleDeletePhoto}
                        onEditCaption={startEditCaption}
                        editingCaption={editingCaption}
                        captionValue={captionValue}
                        onCaptionChange={setCaptionValue}
                        onSaveCaption={saveCaption}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <div className="text-center py-12">
              <Upload size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No photos in this album yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload some photos using the form above
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          as={Link}
          to={`/admin/gallery/${album.id}/edit`}
          variant="flat"
        >
          Edit Album Details
        </Button>
        <Button
          as="a"
          href={`/gallery/${album.slug}`}
          target="_blank"
          variant="flat"
        >
          View Album Page
        </Button>
      </div>
    </div>
  );
}
