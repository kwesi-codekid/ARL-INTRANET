/**
 * Admin Events Creation Page
 * Task: 1.3.1.1.5 - Create new event
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
import { ArrowLeft, Save, ImagePlus, X, Calendar, MapPin, Clock, Users, Mail, Phone, Link as LinkIcon } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useNavigation, Form, Link, redirect } from "react-router";
import { RichTextEditor } from "~/components/admin";

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

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  await requireAuth(request);
  return Response.json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Event } = await import("~/lib/db/models/event.server");
  const { uploadImage } = await import("~/lib/services/upload.server");

  const user = await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();

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
  let featuredImage: string | null = null;

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

  // Generate unique slug
  let slug = generateSlug(title);
  const existingSlug = await Event.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  // Create event
  const event = await Event.create({
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
    featuredImage,
    status,
    isFeatured,
    createdBy: sessionData?.userId,
  });

  if (status === "published") {
    const { sendPushNotificationToAll } = await import("~/lib/services/push-notification.server");
    sendPushNotificationToAll({
      title: "New Event: " + title,
      body: description.substring(0, 120),
      url: "/events/" + slug,
    });
  }

  return redirect(`/admin/events/${event._id}/edit?success=created`);
}

export default function AdminEventsNewPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isFeatured, setIsFeatured] = useState(false);
  const [registrationRequired, setRegistrationRequired] = useState(false);
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
          to="/admin/events"
          className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <p className="text-sm text-gray-500">Add a new company event</p>
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
                <h2 className="font-semibold">Event Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  name="title"
                  label="Event Title"
                  placeholder="Enter event title"
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Calendar size={16} className="text-gray-400" />}
                />

                <Textarea
                  name="description"
                  label="Description"
                  placeholder="Brief description of the event"
                  isRequired
                  maxLength={500}
                  classNames={{ inputWrapper: "bg-gray-50" }}
                />

                <RichTextEditor
                  name="content"
                  label="Full Content (Optional)"
                  placeholder="Detailed event information..."
                  minHeight="200px"
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
                    isRequired
                    classNames={{ inputWrapper: "bg-gray-50" }}
                  />
                  <Input
                    name="endDate"
                    label="End Date (Optional)"
                    type="date"
                    classNames={{ inputWrapper: "bg-gray-50" }}
                  />
                </div>

                <Input
                  name="time"
                  label="Time"
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Clock size={16} className="text-gray-400" />}
                />

                <Input
                  name="location"
                  label="Location"
                  placeholder="e.g., Main Conference Room"
                  isRequired
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<MapPin size={16} className="text-gray-400" />}
                />

                <Input
                  name="locationDetails"
                  label="Location Details (Optional)"
                  placeholder="Additional location information"
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
                  classNames={{ inputWrapper: "bg-gray-50" }}
                  startContent={<Users size={16} className="text-gray-400" />}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="contactEmail"
                    label="Contact Email"
                    type="email"
                    placeholder="events@company.com"
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    startContent={<Mail size={16} className="text-gray-400" />}
                  />
                  <Input
                    name="contactPhone"
                    label="Contact Phone"
                    placeholder="+233 XX XXX XXXX"
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
                    htmlFor="eventImageFile"
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
                  id="eventImageFile"
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
                  defaultSelectedKeys={["draft"]}
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
                  Save Event
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
                    classNames={{ inputWrapper: "bg-gray-50" }}
                    startContent={<LinkIcon size={16} className="text-gray-400" />}
                  />
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
