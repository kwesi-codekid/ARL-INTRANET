/**
 * Admin Executive Messages Management Page
 * Task: CEO Talk Slideshow - Manage executive/manager messages
 */

import { useState, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image,
} from "@heroui/react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  GripVertical,
} from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";

interface ExecutiveMessage {
  id: string;
  name: string;
  title: string;
  photo: string;
  message: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface LoaderData {
  messages: ExecutiveMessage[];
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getAllExecutiveMessages, createExecutiveMessage, updateExecutiveMessage, deleteExecutiveMessage, toggleExecutiveMessageActive } = await import("~/lib/services/executive-message.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const messages = await getAllExecutiveMessages();

  return Response.json({
    messages: messages.map((msg) => ({
      id: msg._id.toString(),
      name: msg.name,
      title: msg.title,
      photo: msg.photo,
      message: msg.message,
      isActive: msg.isActive,
      order: msg.order,
      createdAt: msg.createdAt,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getAllExecutiveMessages, createExecutiveMessage, updateExecutiveMessage, deleteExecutiveMessage, toggleExecutiveMessageActive } = await import("~/lib/services/executive-message.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const photo = formData.get("photo") as string;
    const message = formData.get("message") as string;

    if (!name || !title || !photo || !message) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    await createExecutiveMessage({
      name,
      title,
      photo,
      message,
      createdBy: sessionData!.userId,
    });

    return Response.json({ success: true, message: "Executive message created" });
  }

  if (intent === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const photo = formData.get("photo") as string;
    const message = formData.get("message") as string;

    await updateExecutiveMessage(id, { name, title, photo, message });
    return Response.json({ success: true, message: "Executive message updated" });
  }

  if (intent === "toggle-active") {
    const id = formData.get("id") as string;
    await toggleExecutiveMessageActive(id);
    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteExecutiveMessage(id);
    return Response.json({ success: true, message: "Executive message deleted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminExecutiveMessagesPage() {
  const { messages } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingMessage, setEditingMessage] = useState<ExecutiveMessage | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    title: "",
    photo: "",
    message: "",
  });
  const [previewImage, setPreviewImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingMessage(null);
    setFormState({ name: "", title: "", photo: "", message: "" });
    setPreviewImage("");
    onOpen();
  };

  const openEditModal = (msg: ExecutiveMessage) => {
    setEditingMessage(msg);
    setFormState({
      name: msg.name,
      title: msg.title,
      photo: msg.photo,
      message: msg.message,
    });
    setPreviewImage(msg.photo);
    onOpen();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.url) {
        setFormState((prev) => ({ ...prev, photo: result.url }));
        setPreviewImage(result.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Messages</h1>
          <p className="text-sm text-gray-500">Manage CEO and manager messages for the homepage slideshow</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={openCreateModal}>
          Add Executive
        </Button>
      </div>

      {/* Success/Error Message */}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
        </div>
      )}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {/* Messages List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {messages.map((msg, index) => (
          <Card key={msg.id} className={`shadow-sm ${!msg.isActive ? "opacity-60" : ""}`}>
            <CardBody className="p-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Image
                    src={msg.photo}
                    alt={msg.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{msg.name}</h3>
                      <p className="text-xs text-gray-500">{msg.title}</p>
                    </div>
                    <Chip size="sm" variant="flat" color={msg.isActive ? "success" : "default"}>
                      {msg.isActive ? "Active" : "Hidden"}
                    </Chip>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">"{msg.message}"</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <span className="text-xs text-gray-400">Order: {index + 1}</span>
                <div className="flex gap-1">
                  <Form method="post">
                    <input type="hidden" name="intent" value="toggle-active" />
                    <input type="hidden" name="id" value={msg.id} />
                    <Button
                      type="submit"
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color={msg.isActive ? "success" : "default"}
                      isLoading={isSubmitting}
                      title={msg.isActive ? "Hide" : "Show"}
                    >
                      {msg.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                  </Form>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => openEditModal(msg)}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Form method="post" onSubmit={(e) => {
                    if (!confirm("Delete this executive message?")) e.preventDefault();
                  }}>
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={msg.id} />
                    <Button
                      type="submit"
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="danger"
                      isLoading={isSubmitting}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Form>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {messages.length === 0 && (
        <Card className="shadow-sm">
          <CardBody className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No executive messages yet</p>
            <p className="text-sm text-gray-400">Add your first executive message to display on the homepage</p>
          </CardBody>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <Form method="post" onSubmit={() => onClose()}>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <Users size={20} />
                <span>{editingMessage ? "Edit Executive Message" : "Add Executive Message"}</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value={editingMessage ? "update" : "create"} />
              {editingMessage && <input type="hidden" name="id" value={editingMessage.id} />}
              <input type="hidden" name="photo" value={formState.photo} />

              <div className="space-y-4">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                  <div className="flex items-center gap-4">
                    {previewImage ? (
                      <Image
                        src={previewImage}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Users size={32} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="flat"
                        startContent={<Upload size={16} />}
                        onPress={() => fileInputRef.current?.click()}
                      >
                        Upload Photo
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">Recommended: Square image, min 200x200px</p>
                    </div>
                  </div>
                </div>

                <Input
                  label="Name"
                  name="name"
                  value={formState.name}
                  onValueChange={(value) => setFormState({ ...formState, name: value })}
                  placeholder="e.g., Angela List"
                  isRequired
                />

                <Input
                  label="Title/Position"
                  name="title"
                  value={formState.title}
                  onValueChange={(value) => setFormState({ ...formState, title: value })}
                  placeholder="e.g., CEO, Nguvu Mining Limited"
                  isRequired
                />

                <Textarea
                  label="Message"
                  name="message"
                  value={formState.message}
                  onValueChange={(value) => setFormState({ ...formState, message: value })}
                  placeholder="Enter the executive's message..."
                  maxLength={500}
                  minRows={3}
                  isRequired
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
                isDisabled={!formState.photo}
              >
                {editingMessage ? "Save Changes" : "Add Executive"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
