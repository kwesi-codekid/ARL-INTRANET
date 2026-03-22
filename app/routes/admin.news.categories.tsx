/**
 * Admin News Category Management
 * Task: 1.1.3.4.7
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
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, useNavigation, Link } from "react-router";




function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { NewsCategory, News } = await import("~/lib/db/models/news.server");

  await requireAuth(request);
  await connectDB();

  const categories = await NewsCategory.find().sort({ order: 1 }).lean();

  // Get article counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat) => {
      const count = await News.countDocuments({ category: cat._id });
      return {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        color: cat.color,
        isActive: cat.isActive,
        order: cat.order,
        articleCount: count,
      };
    })
  );

  return Response.json({ categories: categoriesWithCounts });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { NewsCategory, News } = await import("~/lib/db/models/news.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = generateSlug(name);
    const existingSlug = await NewsCategory.findOne({ slug });
    if (existingSlug) {
      return Response.json({ error: "Category with this name already exists" }, { status: 400 });
    }

    const maxOrder = await NewsCategory.findOne().sort({ order: -1 }).select("order");
    const order = (maxOrder?.order || 0) + 1;

    await NewsCategory.create({
      name,
      slug,
      description,
      color: color || "#d2ab66",
      order,
    });

    return Response.json({ success: true, message: "Category created" });
  }

  if (intent === "update") {
    const categoryId = formData.get("categoryId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await NewsCategory.findById(categoryId);
    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    category.name = name;
    category.description = description;
    category.color = color || "#d2ab66";
    await category.save();

    return Response.json({ success: true, message: "Category updated" });
  }

  if (intent === "toggle-active") {
    const categoryId = formData.get("categoryId") as string;
    const category = await NewsCategory.findById(categoryId);
    if (category) {
      category.isActive = !category.isActive;
      await category.save();
    }
    return Response.json({ success: true, message: "Category status updated" });
  }

  if (intent === "delete") {
    const categoryId = formData.get("categoryId") as string;

    // Check if category has articles
    const articleCount = await News.countDocuments({ category: categoryId });
    if (articleCount > 0) {
      return Response.json(
        { error: `Cannot delete category with ${articleCount} articles. Move or delete articles first.` },
        { status: 400 }
      );
    }

    await NewsCategory.findByIdAndDelete(categoryId);
    return Response.json({ success: true, message: "Category deleted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminNewsCategoriesPage() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState<typeof categories[0] | null>(null);

  const openCreateModal = () => {
    setEditingCategory(null);
    onOpen();
  };

  const openEditModal = (category: typeof categories[0]) => {
    setEditingCategory(category);
    onOpen();
  };

  const handleClose = () => {
    setEditingCategory(null);
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Categories</h1>
          <p className="text-sm text-gray-500">Manage news article categories</p>
        </div>
        <div className="flex gap-2">
          <Button as={Link} to="/admin/news" variant="flat">
            Back to News
          </Button>
          <Button color="primary" startContent={<Plus size={18} />} onPress={openCreateModal}>
            Add Category
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

      {/* Categories Table */}
      <Card className="shadow-sm">
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Categories table" removeWrapper className="min-w-[500px]">
            <TableHeader>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>COLOR</TableColumn>
              <TableColumn>ARTICLES</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No categories found">
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-gray-500">{category.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-500">{category.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{category.articleCount}</span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={category.isActive ? "success" : "default"}
                      variant="flat"
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => openEditModal(category)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="toggle-active" />
                        <input type="hidden" name="categoryId" value={category.id} />
                        <Button type="submit" size="sm" variant="light" isLoading={isSubmitting}>
                          {category.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </Form>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="categoryId" value={category.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          isDisabled={category.articleCount > 0}
                          onPress={(e) => {
                            if (!confirm("Are you sure you want to delete this category?")) {
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
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <Form method="post" onSubmit={() => handleClose()}>
            <ModalHeader>
              {editingCategory ? "Edit Category" : "Create Category"}
            </ModalHeader>
            <ModalBody>
              <input
                type="hidden"
                name="intent"
                value={editingCategory ? "update" : "create"}
              />
              {editingCategory && (
                <input type="hidden" name="categoryId" value={editingCategory.id} />
              )}
              <div className="space-y-4">
                <Input
                  name="name"
                  label="Name"
                  placeholder="Enter category name"
                  defaultValue={editingCategory?.name}
                  isRequired
                />
                <Input
                  name="description"
                  label="Description"
                  placeholder="Brief description (optional)"
                  defaultValue={editingCategory?.description}
                />
                <Input
                  name="color"
                  type="color"
                  label="Color"
                  defaultValue={editingCategory?.color || "#d2ab66"}
                  classNames={{
                    input: "h-10",
                  }}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                {editingCategory ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
