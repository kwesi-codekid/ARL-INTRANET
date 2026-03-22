/**
 * Admin Policy Categories Page
 * Manage policy categories
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2, ArrowLeft, GripVertical } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useNavigation, Link } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getPolicyCategories, createPolicyCategory, updatePolicyCategory, deletePolicyCategory, reorderPolicyCategories, serializePolicyCategory } = await import("~/lib/services/policy.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Policy } = await import("~/lib/db/models/policy.server");

  await requireAuth(request);
  await connectDB();

  const categories = await getPolicyCategories();

  // Get policy count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Policy.countDocuments({ category: cat._id });
      return {
        ...serializePolicyCategory(cat),
        policyCount: count,
      };
    })
  );

  return Response.json({ categories: categoriesWithCount });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getPolicyCategories, createPolicyCategory, updatePolicyCategory, deletePolicyCategory, reorderPolicyCategories, serializePolicyCategory } = await import("~/lib/services/policy.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Policy } = await import("~/lib/db/models/policy.server");

  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;
    const icon = formData.get("icon") as string;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await createPolicyCategory({
      name,
      description,
      color: color || "#d2ab67",
      icon,
    });

    await logActivity({
      userId: sessionData?.userId,
      action: "create",
      resource: "policy-category",
      resourceId: category._id.toString(),
      details: { name },
      request,
    });

    return Response.json({ success: true, message: "Category created" });
  }

  if (intent === "update") {
    const categoryId = formData.get("categoryId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;
    const icon = formData.get("icon") as string;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    await updatePolicyCategory(categoryId, {
      name,
      description,
      color,
      icon,
    });

    await logActivity({
      userId: sessionData?.userId,
      action: "update",
      resource: "policy-category",
      resourceId: categoryId,
      details: { name },
      request,
    });

    return Response.json({ success: true, message: "Category updated" });
  }

  if (intent === "delete") {
    const categoryId = formData.get("categoryId") as string;

    try {
      await deletePolicyCategory(categoryId);

      await logActivity({
        userId: sessionData?.userId,
        action: "delete",
        resource: "policy-category",
        resourceId: categoryId,
        details: {},
        request,
      });

      return Response.json({ success: true, message: "Category deleted" });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Delete failed" },
        { status: 400 }
      );
    }
  }

  if (intent === "toggle-active") {
    const categoryId = formData.get("categoryId") as string;
    const isActive = formData.get("isActive") === "true";

    await updatePolicyCategory(categoryId, { isActive: !isActive });

    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "reorder") {
    const orderedIds = formData.get("orderedIds") as string;
    const ids = JSON.parse(orderedIds);

    await reorderPolicyCategories(ids);

    return Response.json({ success: true, message: "Order updated" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  policyCount: number;
}

export default function AdminPolicyCategoriesPage() {
  const { categories } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#d2ab67",
    icon: "",
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      color: "#d2ab67",
      icon: "",
    });
    onOpen();
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#d2ab67",
      icon: category.icon || "",
    });
    onOpen();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/policies"
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Policy Categories
            </h1>
            <p className="text-sm text-gray-500">
              Organize policies into categories
            </p>
          </div>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={openCreateModal}
        >
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <h2 className="text-lg font-semibold">Categories</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Policy categories table" removeWrapper className="min-w-[500px]">
            <TableHeader>
              <TableColumn width={50}></TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>POLICIES</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No categories found. Create one to get started.">
              {categories.map((category: Category) => (
                <TableRow key={category._id}>
                  <TableCell>
                    <GripVertical
                      size={16}
                      className="cursor-move text-gray-400"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg"
                        style={{ backgroundColor: category.color || "#d2ab67" }}
                      />
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-gray-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {category.policyCount} policies
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Form method="post" className="inline">
                      <input type="hidden" name="intent" value="toggle-active" />
                      <input
                        type="hidden"
                        name="categoryId"
                        value={category._id}
                      />
                      <input
                        type="hidden"
                        name="isActive"
                        value={category.isActive.toString()}
                      />
                      <button type="submit">
                        <Chip
                          size="sm"
                          color={category.isActive ? "success" : "default"}
                          variant="flat"
                          className="cursor-pointer"
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Chip>
                      </button>
                    </Form>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => openEditModal(category)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="delete" />
                        <input
                          type="hidden"
                          name="categoryId"
                          value={category._id}
                        />
                        <Button
                          isIconOnly
                          variant="light"
                          color="danger"
                          size="sm"
                          type="submit"
                          isDisabled={category.policyCount > 0}
                          onPress={(e) => {
                            if (
                              !confirm(
                                "Are you sure you want to delete this category?"
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <Form method="post" onSubmit={() => onClose()}>
            <ModalHeader>
              {editingCategory ? "Edit Category" : "Create Category"}
            </ModalHeader>
            <ModalBody className="space-y-4">
              <input
                type="hidden"
                name="intent"
                value={editingCategory ? "update" : "create"}
              />
              {editingCategory && (
                <input
                  type="hidden"
                  name="categoryId"
                  value={editingCategory._id}
                />
              )}

              <Input
                name="name"
                label="Category Name"
                placeholder="e.g., HR Policies"
                value={formData.name}
                onValueChange={(v) => setFormData({ ...formData, name: v })}
                isRequired
              />

              <Input
                name="description"
                label="Description"
                placeholder="Brief description (optional)"
                value={formData.description}
                onValueChange={(v) =>
                  setFormData({ ...formData, description: v })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="color"
                  label="Color"
                  type="color"
                  value={formData.color}
                  onValueChange={(v) => setFormData({ ...formData, color: v })}
                />

                <Input
                  name="icon"
                  label="Icon Name"
                  placeholder="e.g., shield"
                  value={formData.icon}
                  onValueChange={(v) => setFormData({ ...formData, icon: v })}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
