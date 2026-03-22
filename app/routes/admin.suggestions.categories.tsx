/**
 * Admin Suggestion Categories Management
 * Task: 1.3.2.3.8 - Create suggestion category management
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { ArrowLeft, Plus, Edit2, Trash2, FolderOpen } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form, Link, useSubmit } from "react-router";

type LoaderData = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    order: number;
    suggestionCount: number;
  }>;
};

type ActionData =
  {
    success?: boolean;
    message?: string;
    error?: string;
  };

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getAllCategories } = await import("~/lib/services/suggestion.server");
  const { Suggestion } = await import("~/lib/db/models/suggestion.server");

  await requireAuth(request);
  await connectDB();

  const categories = await getAllCategories();

  // Get suggestion counts per category
  const categoryCounts = await Suggestion.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countsMap = new Map(
    categoryCounts.map((c) => [c._id.toString(), c.count])
  );

  return Response.json({
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description,
      isActive: c.isActive,
      order: c.order,
      suggestionCount: countsMap.get(c._id.toString()) || 0,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { createCategory, updateCategory, deleteCategory } = await import(
    "~/lib/services/suggestion.server"
  );

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name || name.trim().length < 2) {
      return Response.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }

    await createCategory({ name: name.trim(), description: description?.trim() });
    return Response.json({ success: true, message: "Category created" });
  }

  if (intent === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const isActive = formData.get("isActive") === "true";

    if (!name || name.trim().length < 2) {
      return Response.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }

    await updateCategory(id, {
      name: name.trim(),
      description: description?.trim(),
      isActive,
    });
    return Response.json({ success: true, message: "Category updated" });
  }

  if (intent === "toggle-active") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";

    await updateCategory(id, { isActive });
    return Response.json({ success: true, message: "Category updated" });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;

    try {
      await deleteCategory(id);
      return Response.json({ success: true, message: "Category deleted" });
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 400 });
    }
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminSuggestionCategoriesPage() {
  const { categories } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    onOpen();
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    onOpen();
  };

  const handleClose = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/suggestions"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suggestion Categories</h1>
            <p className="text-sm text-gray-500">Manage categories for the suggestion box</p>
          </div>
        </div>
        <Button color="primary" startContent={<Plus size={16} />} onPress={openCreateModal}>
          Add Category
        </Button>
      </div>

      {/* Messages */}
      {actionData?.success && actionData.message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
        </div>
      )}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {/* Categories List */}
      <Card className="shadow-sm">
        <CardHeader>
          <h2 className="font-semibold">Categories ({categories.length})</h2>
        </CardHeader>
        <CardBody>
          {categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((category: LoaderData["categories"][number]) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        category.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {category.suggestionCount} suggestion(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      size="sm"
                      isSelected={category.isActive}
                      onValueChange={(value) => {
                        submit(
                          {
                            intent: "toggle-active",
                            id: category.id,
                            isActive: value.toString(),
                          },
                          { method: "post" }
                        );
                      }}
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => openEditModal(category)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    {category.suggestionCount === 0 && (
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="flat"
                        type="button"
                        onPress={() => {
                          if (!confirm("Delete this category?")) return;
                          submit({ intent: "delete", id: category.id }, { method: "post" });
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No categories yet</p>
              <p className="text-sm text-gray-400">Create your first category to get started</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <Form method="post">
            <input type="hidden" name="intent" value={editingCategory ? "update" : "create"} />
            {editingCategory && (
              <input type="hidden" name="id" value={editingCategory.id} />
            )}
            {editingCategory && (
              <input type="hidden" name="isActive" value={editingCategory.isActive.toString()} />
            )}

            <ModalHeader>
              {editingCategory ? "Edit Category" : "Create Category"}
            </ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onValueChange={(value) => setFormData({ ...formData, name: value })}
                placeholder="e.g., Workplace Improvement"
                isRequired
              />
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onValueChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Optional description for this category"
                minRows={2}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting}
                isDisabled={!formData.name.trim()}
              >
                {editingCategory ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
