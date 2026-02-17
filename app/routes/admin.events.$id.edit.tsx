/**
 * Admin Events Edit Page
 * Task: 1.3.1.1.6 - Edit event
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
  Chip,
} from "@heroui/react";
import { ArrowLeft, Save, ImagePlus, X, Calendar, MapPin, Clock, Users, Mail, Phone, Link as LinkIcon, Trash2 } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useSearchParams, Form, Link, redirect } from "react-router";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EVENT_CATEGORIES = [
  "Company Event",
  "Training",
  "Workshop",
  "Meeting",
  "Conference",
  "Social",
  "Health & Safety",
  "Sports",
  "Community",
  "Other",
];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Event } = await import("~/lib/db/models/event.server");

  await requireAuth(request);
  await connectDB();

  const event = await Event.findById(params.id).lean();

  if (!event) {
    throw new Response("Event not found", { status: 404 });
  }

  return Response.json({
    event: {
      id: event._id.toString(),
      title: event.title,
      slug: event.slug,
      description: event.description,
      content: event.content,
      date: event.date?.toISOString().split("T")[0],
      endDate: event.endDate?.toISOString().split("T")[0],
      time: event.time,
      location: event.location,
      locationDetails: event.locationDetails,
      category: event.category,
      organizer: event.organizer,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      registrationRequired: event.registrationRequired,
      registrationLink: event.registrationLink,
      featuredImage: event.featuredImage,
      images: event.images,
      status: event.status,
      isFeatured: event.isFeatured,
    },
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Event } = await import("~/lib/db/models/event.server");
  const { uploadImage } = await import("~/lib/services/upload.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Handle delete
  if (intent === "delete") {
    await Event.findByIdAndDelete(params.id);
    return redirect("/admin/events?deleted=true");
  }

  // Handle update
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const content = formData.get("content") as string;
  const date = formData.get("date") as string;
  const endDate = formData.get("endDate") as string;
  const time = formData.get("time") as string;
  const location = formData.get("location") as string;
  const locationDetails = formData.get("locationDetails") as string;
  const category = formData.get("category") as string;
  const organizer = formData.get("organizer") as string;
  const contactEmail = formData.get("contactEmail") as string;
  const contactPhone = formData.get("contactPhone") as string;
  const registrationRequired = formData.get("registrationRequired") === "true";
  const registrationLink = formData.get("registrationLink") as string;
  const status = formData.get("status") as "draft" | "published";
  const isFeatured = formData.get("isFeatured") === "true";

  // Handle file upload
  let featuredImage: string | undefined;
  const imageFile = formData.get("imageFile") as File | null;

  if (imageFile && imageFile.size > 0) {
    const imageResult = await uploadImage(imageFile, "events");
    if (imageResult.success && imageResult.url) {
      featuredImage = imageResult.url;
    } else {
      return Response.json(
        { error: imageResult.error || "Failed to upload image" },
        { status: 400 }
      );
    }
  }

  // Validation
  if (!title || !description || !date || !location) {
    return Response.json(
      { error: "Title, description, date, and location are required" },
      { status: 400 }
    );
  }

  // Get current event to check slug
  const currentEvent = await Event.findById(params.id);
  if (!currentEvent) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  // Generate new slug if title changed
  let slug = currentEvent.slug;
  if (title !== currentEvent.title) {
    slug = generateSlug(title);
    const existingSlug = await Event.findOne({ slug, _id: { $ne: params.id } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // Update event
  const updateData: Record<string, unknown> = {
    title,
    slug,
    description,
    content: content || undefined,
    date: new Date(date),
    endDate: endDate ? new Date(endDate) : undefined,
    time: time || undefined,
    location,
    locationDetails: locationDetails || undefined,
    category: category || undefined,
    organizer: organizer || undefined,
    contactEmail: contactEmail || undefined,
    contactPhone: contactPhone || undefined,
    registrationRequired,
    registrationLink: registrationLink || undefined,
    status,
    isFeatured,
  };

  if (featuredImage) {
    updateData.featuredImage = featuredImage;
  }

  await Event.findByIdAndUpdate(params.id, updateData);

  return redirect(`/admin/events/${params.id}/edit?success=updated`);
}

export default function AdminEventsEditPage() {
  const { event } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const successMessage = searchParams.get("success");

  const [isFeatured, setIsFeatured] = useState(event.isFeatured);
  const [registrationRequired, setRegistrationRequired] = useState(event.registrationRequired);
  const [imagePreview, setImagePreview] = useState<string | null>(event.featuredImage);
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
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
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
            to="/admin/events"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
            <p className="text-sm text-gray-500">{event.title}</p>
          </div>
        </div>
        <Button
          color="danger"
          variant="flat"
          startContent={<Trash2 size={16} />}
          onPress={handleDelete}
        >
          Delete
        </Button>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {successMessage === "created" ? "Event created successfully!" : "Event updated successfully!"}
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
                <h2 className="font-semibold">Event Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Event Title"
                  placeholder="Enter event title"
                  defaultValue={event.title}
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Calendar size={16} className="text-gray-400" />}
                />

                <Textarea
                  name="description"
                  label="Description"
                  placeholder="Brief description of the event"
                  defaultValue={event.description}
                  isRequired
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <Textarea
                  name="content"
                  label="Full Content (Optional)"
                  placeholder="Detailed event information... (HTML supported)"
                  defaultValue={event.content || ""}
                  minRows={6}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  description="You can use HTML tags for formatting"
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Date & Location</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="date"
                    label="Start Date"
                    type="date"
                    defaultValue={event.date}
                    isRequired
                    classNames={{ inputWrapper: "bg-gray-50" }}
                  />
                  <Input
                    name="endDate"
                    label="End Date (Optional)"
                    type="date"
                    defaultValue={event.endDate || ""}
                    classNames={{ inputWrapper: "bg-gray-50" }}
                  />
                </div>

                <Input
                  name="time"
                  label="Time"
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  defaultValue={event.time || ""}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Clock size={16} className="text-gray-400" />}
                />

                <Input
                  name="location"
                  label="Location"
                  placeholder="e.g., Main Conference Room"
                  defaultValue={event.location}
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<MapPin size={16} className="text-gray-400" />}
                />

                <Input
                  name="locationDetails"
                  label="Location Details (Optional)"
                  placeholder="Additional location information"
                  defaultValue={event.locationDetails || ""}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Organizer & Contact</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="organizer"
                  label="Organizer"
                  placeholder="e.g., HR Department"
                  defaultValue={event.organizer || ""}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Users size={16} className="text-gray-400" />}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="contactEmail"
                    label="Contact Email"
                    type="email"
                    placeholder="events@company.com"
                    defaultValue={event.contactEmail || ""}
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    startContent={<Mail size={16} className="text-gray-400" />}
                  />
                  <Input
                    name="contactPhone"
                    label="Contact Phone"
                    placeholder="+233 XX XXX XXXX"
                    defaultValue={event.contactPhone || ""}
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    startContent={<Phone size={16} className="text-gray-400" />}
                  />
                </div>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Featured Image</h2>
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
                    htmlFor="eventEditImageFile"
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
                  id="eventEditImageFile"
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
                  defaultSelectedKeys={[event.status]}
                  classNames={{ trigger: "bg-gray-50" }}
                >
                  <SelectItem key="draft">Draft</SelectItem>
                  <SelectItem key="published">Published</SelectItem>
                </Select>

                <Divider />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Featured Event</span>
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
                  Update Event
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
                  label="Event Category"
                  placeholder="Choose a category"
                  defaultSelectedKeys={event.category ? [event.category] : undefined}
                  classNames={{ trigger: "bg-gray-50" }}
                  isRequired={false}
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat}>{cat}</SelectItem>
                  ))}
                </Select>
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Registration</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Registration Required</span>
                  <Switch
                    isSelected={registrationRequired}
                    onValueChange={setRegistrationRequired}
                    size="sm"
                  />
                </div>
                <input type="hidden" name="registrationRequired" value={registrationRequired.toString()} />

                {registrationRequired && (
                  <Input
                    name="registrationLink"
                    label="Registration Link"
                    placeholder="https://..."
                    defaultValue={event.registrationLink || ""}
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    startContent={<LinkIcon size={16} className="text-gray-400" />}
                  />
                )}
              </CardBody>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Quick Actions</h2>
              </CardHeader>
              <CardBody>
                <Button
                  as="a"
                  href={`/events/${event.slug}`}
                  target="_blank"
                  variant="flat"
                  fullWidth
                >
                  View Event Page
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
