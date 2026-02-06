/**
 * Admin Safety Categories Page
 * Task: 1.2.2.4.6 - Create safety category management page
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
  Textarea,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useSubmit } from "react-router";
import type { SerializedSafetyCategory } from "~/lib/services/safety.server";

interface LoaderData {
  categories: SerializedSafetyCategory[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, createSafetyCategory, updateSafetyCategory, deleteSafetyCategory, generateUniqueCategorySlug, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const categories = await getSafetyCategories(false);

  return Response.json({
    categories: categories.map(serializeSafetyCategory),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyCategories, createSafetyCategory, updateSafetyCategory, deleteSafetyCategory, generateUniqueCategorySlug, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;
    const icon = formData.get("icon") as string;
    const order = parseInt(formData.get("order") as string) || 0;
    const isActive = formData.get("isActive") === "true";

    const slug = await generateUniqueCategorySlug(name);
    await createSafetyCategory({
      name,
      slug,
      description,
      color,
      icon,
      order,
      isActive,
    });
  } else if (intent === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;
    const icon = formData.get("icon") as string;
    const order = parseInt(formData.get("order") as string) || 0;
    const isActive = formData.get("isActive") === "true";

    await updateSafetyCategory(id, {
      name,
      description,
      color,
      icon,
      order,
      isActive,
    });
  } else if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteSafetyCategory(id);
  } else if (intent === "toggle-active") {
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await updateSafetyCategory(id, { isActive: !isActive });
  }

  return Response.json({ success: true });
}

export default function AdminSafetyCategoriesPage() {
  const { categories } = useLoaderData<LoaderData>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editCategory, setEditCategory] = useState<SerializedSafetyCategory | null>(null);
  const submit = useSubmit();

  const handleEdit = (category: SerializedSafetyCategory) => {
    setEditCategory(category);
    onOpen();
  };

  const handleAdd = () => {
    setEditCategory(null);
    onOpen();
  };

  const handleClose = () => {
    setEditCategory(null);
    onClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Safety Categories</h1>
          <p className="text-gray-500">Manage categories for safety tips and videos</p>
        </div>
        <Button color="success" startContent={<Plus size={18} />} onPress={handleAdd}>
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card className="shadow-sm">
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Safety categories table" removeWrapper className="min-w-[500px]">
            <TableHeader>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>DESCRIPTION</TableColumn>
              <TableColumn>ORDER</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No categories found">
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Tag size={18} style={{ color: category.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">{category.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description || "-"}
                    </p>
                  </TableCell>
                  <TableCell>{category.order}</TableCell>
                  <TableCell>
                    <Form method="post">
                      <input type="hidden" name="intent" value="toggle-active" />
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="isActive" value={String(category.isActive)} />
                      <Switch
                        size="sm"
                        isSelected={category.isActive}
                        onChange={() => {
                          const formData = new FormData();
                          formData.set("intent", "toggle-active");
                          formData.set("id", category.id);
                          formData.set("isActive", String(category.isActive));
                          submit(formData, { method: "post" });
                        }}
                      />
                    </Form>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => handleEdit(category)}
                      >
                        <Edit size={18} />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        color="danger"
                        onPress={() => {
                          if (confirm("Are you sure you want to delete this category?")) {
                            const formData = new FormData();
                            formData.set("intent", "delete");
                            formData.set("id", category.id);
                            submit(formData, { method: "post" });
                          }
                        }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalContent>
          <Form method="post" onSubmit={handleClose}>
            <ModalHeader>
              {editCategory ? "Edit Category" : "Add Category"}
            </ModalHeader>
            <ModalBody className="space-y-4">
              <input
                type="hidden"
                name="intent"
                value={editCategory ? "update" : "create"}
              />
              {editCategory && (
                <input type="hidden" name="id" value={editCategory.id} />
              )}

              <Input
                label="Name"
                name="name"
                defaultValue={editCategory?.name || ""}
                isRequired
                placeholder="e.g., PPE Safety"
              />

              <Textarea
                label="Description"
                name="description"
                defaultValue={editCategory?.description || ""}
                placeholder="Brief description of the category"
                minRows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Color"
                  name="color"
                  type="color"
                  defaultValue={editCategory?.color || "#10B981"}
                  classNames={{
                    input: "h-10",
                  }}
                />

                <Input
                  label="Icon"
                  name="icon"
                  defaultValue={editCategory?.icon || ""}
                  placeholder="e.g., shield"
                />
              </div>

              <Input
                label="Order"
                name="order"
                type="number"
                defaultValue={String(editCategory?.order || 0)}
                description="Lower numbers appear first"
              />

              <div className="flex items-center gap-2">
                <Switch
                  name="isActive"
                  value="true"
                  defaultSelected={editCategory?.isActive ?? true}
                >
                  Active
                </Switch>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button type="submit" color="success">
                {editCategory ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
