/**
 * Admin IT Tips Management Page
 * Task: IT Tips Feature - Admin can push out tips anytime
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
} from "@heroui/react";
import {
  Lightbulb,
  Plus,
  Pencil,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Keyboard,
  Monitor,
  Cpu,
  HelpCircle,
} from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import { requireAuth, getSessionData } from "~/lib/services/session.server";
import { connectDB } from "~/lib/db/connection.server";
import {
  getAllITTips,
  createITTip,
  updateITTip,
  deleteITTip,
  toggleITTipActive,
  toggleITTipPinned,
  getITTipCategories,
} from "~/lib/services/it-tip.server";

interface ITTip {
  id: string;
  title: string;
  content: string;
  icon: string;
  category: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  createdBy?: { name: string };
}

interface LoaderData {
  tips: ITTip[];
  categories: { value: string; label: string }[];
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  await connectDB();

  const tips = await getAllITTips();
  const categories = getITTipCategories();

  return Response.json({
    tips: tips.map((tip) => ({
      id: tip._id.toString(),
      title: tip.title,
      content: tip.content,
      icon: tip.icon,
      category: tip.category,
      isActive: tip.isActive,
      isPinned: tip.isPinned,
      createdAt: tip.createdAt,
      createdBy: tip.createdBy,
    })),
    categories,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const icon = formData.get("icon") as string;
    const isPinned = formData.get("isPinned") === "true";

    if (!title || !content || !category) {
      return Response.json({ error: "Title, content, and category are required" }, { status: 400 });
    }

    await createITTip({
      title,
      content,
      category,
      icon: icon || "lightbulb",
      isPinned,
      createdBy: sessionData!.userId,
    });

    return Response.json({ success: true, message: "IT Tip created successfully" });
  }

  if (intent === "update") {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const icon = formData.get("icon") as string;

    await updateITTip(id, { title, content, category, icon });
    return Response.json({ success: true, message: "IT Tip updated" });
  }

  if (intent === "toggle-active") {
    const id = formData.get("id") as string;
    await toggleITTipActive(id);
    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "toggle-pinned") {
    const id = formData.get("id") as string;
    await toggleITTipPinned(id);
    return Response.json({ success: true, message: "Pin status updated" });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteITTip(id);
    return Response.json({ success: true, message: "IT Tip deleted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

const categoryIcons: Record<string, typeof Lightbulb> = {
  security: Shield,
  productivity: Zap,
  shortcuts: Keyboard,
  software: Monitor,
  hardware: Cpu,
  general: HelpCircle,
};

const categoryColors: Record<string, "primary" | "secondary" | "success" | "warning" | "danger" | "default"> = {
  security: "danger",
  productivity: "success",
  shortcuts: "primary",
  software: "secondary",
  hardware: "warning",
  general: "default",
};

export default function AdminITTipsPage() {
  const { tips, categories } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingTip, setEditingTip] = useState<ITTip | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    icon: "lightbulb",
    isPinned: false,
  });

  const openCreateModal = () => {
    setEditingTip(null);
    setFormData({
      title: "",
      content: "",
      category: "general",
      icon: "lightbulb",
      isPinned: false,
    });
    onOpen();
  };

  const openEditModal = (tip: ITTip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      content: tip.content,
      category: tip.category,
      icon: tip.icon,
      isPinned: tip.isPinned,
    });
    onOpen();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IT Tips</h1>
          <p className="text-sm text-gray-500">Manage IT tips for employees</p>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={openCreateModal}>
          New Tip
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

      {/* Tips List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => {
          const CategoryIcon = categoryIcons[tip.category] || Lightbulb;

          return (
            <Card key={tip.id} className={`shadow-sm ${!tip.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="flex justify-between items-start gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-${categoryColors[tip.category]}-100`}>
                    <CategoryIcon size={18} className={`text-${categoryColors[tip.category]}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{tip.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Chip size="sm" variant="flat" color={categoryColors[tip.category]}>
                        {categories.find((c) => c.value === tip.category)?.label}
                      </Chip>
                      {tip.isPinned && (
                        <Chip size="sm" variant="flat" color="warning" startContent={<Pin size={10} />}>
                          Pinned
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-3">{tip.content}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-gray-400">{formatDate(tip.createdAt)}</span>
                  <div className="flex gap-1">
                    <Form method="post">
                      <input type="hidden" name="intent" value="toggle-pinned" />
                      <input type="hidden" name="id" value={tip.id} />
                      <Button
                        type="submit"
                        isIconOnly
                        size="sm"
                        variant="flat"
                        isLoading={isSubmitting}
                        title={tip.isPinned ? "Unpin" : "Pin"}
                      >
                        {tip.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </Button>
                    </Form>
                    <Form method="post">
                      <input type="hidden" name="intent" value="toggle-active" />
                      <input type="hidden" name="id" value={tip.id} />
                      <Button
                        type="submit"
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color={tip.isActive ? "success" : "default"}
                        isLoading={isSubmitting}
                        title={tip.isActive ? "Deactivate" : "Activate"}
                      >
                        {tip.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      </Button>
                    </Form>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => openEditModal(tip)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Form method="post" onSubmit={(e) => {
                      if (!confirm("Delete this tip?")) e.preventDefault();
                    }}>
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={tip.id} />
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
          );
        })}
      </div>

      {tips.length === 0 && (
        <Card className="shadow-sm">
          <CardBody className="text-center py-12">
            <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No IT tips yet</p>
            <p className="text-sm text-gray-400">Click "New Tip" to create one</p>
          </CardBody>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <Form method="post" onSubmit={() => onClose()}>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <Lightbulb size={20} />
                <span>{editingTip ? "Edit IT Tip" : "New IT Tip"}</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value={editingTip ? "update" : "create"} />
              {editingTip && <input type="hidden" name="id" value={editingTip.id} />}

              <div className="space-y-4">
                <Input
                  label="Title"
                  name="title"
                  value={formData.title}
                  onValueChange={(value) => setFormData({ ...formData, title: value })}
                  placeholder="e.g., Strong Password Tips"
                  maxLength={100}
                  isRequired
                />

                <Textarea
                  label="Content"
                  name="content"
                  value={formData.content}
                  onValueChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Write the tip content here..."
                  maxLength={500}
                  minRows={3}
                  isRequired
                />

                <Select
                  label="Category"
                  name="category"
                  selectedKeys={[formData.category]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormData({ ...formData, category: value });
                  }}
                  isRequired
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.value}>{cat.label}</SelectItem>
                  ))}
                </Select>

                <input type="hidden" name="icon" value={formData.icon} />

                {!editingTip && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pin this tip</span>
                    <Switch
                      name="isPinned"
                      isSelected={formData.isPinned}
                      onValueChange={(value) => setFormData({ ...formData, isPinned: value })}
                    />
                    <input type="hidden" name="isPinned" value={formData.isPinned.toString()} />
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                {editingTip ? "Save Changes" : "Create Tip"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
