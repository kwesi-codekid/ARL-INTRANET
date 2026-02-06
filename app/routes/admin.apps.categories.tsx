/**
 * Admin App Link Categories Management
 * Task: 1.1.5.3.2
 */

import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Form, useNavigation, useActionData, Link } from "react-router";
import {
  Card,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch,
} from "@heroui/react";
import {
  Plus, Edit, Trash2, Folder, AppWindow, ArrowLeft,
  LayoutGrid, FileText, Mail, Calendar, Database, Users, Settings,
  Shield, BarChart, Truck, Wrench, Globe, Briefcase, Building, Building2,
  Calculator, CreditCard, DollarSign, Heart, HeartPulse, Activity,
  Stethoscope, AlertTriangle, ShieldCheck, Flame, HardHat, Factory,
} from "lucide-react";

// Icon mapping for rendering
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Folder, AppWindow, LayoutGrid, FileText, Mail, Calendar, Database, Users,
  Settings, Shield, BarChart, Truck, Wrench, Globe, Briefcase, Building,
  Building2, Calculator, CreditCard, DollarSign, Heart, HeartPulse, Activity,
  Stethoscope, AlertTriangle, ShieldCheck, Flame, HardHat, Factory,
};





import type { IAppLinkCategory } from "~/lib/db/models/app-link.server";

// Type definitions
interface CategoryWithCount extends IAppLinkCategory {
  linkCount: number;
}

interface CategoryStats {
  total: number;
  active: number;
}

interface LoaderData {
  categories: CategoryWithCount[];
  stats: CategoryStats;
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

// Available lucide icons for categories
const availableIcons = [
  "Folder", "AppWindow", "LayoutGrid", "FileText", "Mail", "Calendar",
  "Database", "Users", "Settings", "Shield", "BarChart", "Truck", "Wrench", "Globe",
  "Briefcase", "Building", "Building2", "Calculator", "CreditCard", "DollarSign",
  "Heart", "HeartPulse", "Activity", "Stethoscope", "AlertTriangle", "ShieldCheck",
  "Flame", "HardHat", "Factory",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { getCategories, createCategory, updateCategory, deleteCategory, getCategoryStats } = await import("~/lib/services/app-link.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { AppLink } = await import("~/lib/db/models/app-link.server");

  await requireAuth(request);
  await connectDB();

  const [categories, stats] = await Promise.all([
    getCategories({ includeInactive: true }),
    getCategoryStats(),
  ]);

  // Get app link counts per category
  const linkCounts = await AppLink.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    linkCounts.map((c) => [c._id.toString(), c.count])
  );

  const categoriesWithCounts = categories.map((cat) => ({
    ...JSON.parse(JSON.stringify(cat)),
    linkCount: countMap.get(cat._id.toString()) || 0,
  }));

  return Response.json({
    categories: categoriesWithCounts,
    stats,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { getCategories, createCategory, updateCategory, deleteCategory, getCategoryStats } = await import("~/lib/services/app-link.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { AppLink } = await import("~/lib/db/models/app-link.server");

  await requireAuth(request);
  await connectDB();

  const sessionData = await getSessionData(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Create Category
  if (intent === "create") {
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      icon: formData.get("icon") as string || undefined,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: true,
    };

    if (!data.name || !data.slug) {
      return Response.json({ error: "Name and slug are required" });
    }

    try {
      const category = await createCategory(data);

      await logActivity({
        userId: sessionData?.userId,
        action: "create",
        resource: "applinkcategory",
        resourceId: category._id.toString(),
        details: { name: data.name, slug: data.slug },
        request,
      });

      return Response.json({ success: true, message: "Category created successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return Response.json({ error: "Category slug already exists" });
      }
      throw error;
    }
  }

  // Update Category
  if (intent === "update") {
    const id = formData.get("id") as string;
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      icon: formData.get("icon") as string || undefined,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: formData.get("isActive") === "true",
    };

    try {
      await updateCategory(id, data);

      await logActivity({
        userId: sessionData?.userId,
        action: "update",
        resource: "applinkcategory",
        resourceId: id,
        details: { name: data.name, slug: data.slug },
        request,
      });

      return Response.json({ success: true, message: "Category updated successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return Response.json({ error: "Category slug already exists" });
      }
      throw error;
    }
  }

  // Delete Category
  if (intent === "delete") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;

    try {
      await deleteCategory(id);

      await logActivity({
        userId: sessionData?.userId,
        action: "delete",
        resource: "applinkcategory",
        resourceId: id,
        details: { name },
        request,
      });

      return Response.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return Response.json({ error: error.message });
      }
      throw error;
    }
  }

  return Response.json({ error: "Invalid action" });
}

interface CategoryWithCount extends IAppLinkCategory {
  linkCount: number;
}

export default function AdminAppsCategories() {
  const { categories, stats } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState<CategoryWithCount | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CategoryWithCount | null>(null);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button
          as={Link}
          to="/admin/apps"
          variant="light"
          startContent={<ArrowLeft size={18} />}
        >
          Back to App Links
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-primary-100 p-3">
              <Folder className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Categories</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-success-100 p-3">
              <Folder className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Categories</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">App Link Categories</h2>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={() => setIsCreateOpen(true)}
        >
          Add Category
        </Button>
      </div>

      {/* Success/Error Messages */}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {actionData.message}
        </div>
      )}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {/* Categories Table */}
      <Card>
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Categories table" removeWrapper className="min-w-[500px]">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>SLUG</TableColumn>
              <TableColumn>ICON</TableColumn>
              <TableColumn>APP LINKS</TableColumn>
              <TableColumn>ORDER</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No categories found">
              {categories.map((cat: CategoryWithCount) => (
                <TableRow key={cat._id.toString()}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                      {cat.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {cat.icon || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <AppWindow size={14} className="text-gray-400" />
                      <span>{cat.linkCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>{cat.order}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={cat.isActive ? "success" : "default"}
                      variant="flat"
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => setEditCat(cat)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        isDisabled={cat.linkCount > 0}
                        onPress={() => setDeleteConfirm(cat)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="lg">
        <ModalContent>
          <Form method="post" onSubmit={() => setIsCreateOpen(false)}>
            <ModalHeader>Add New Category</ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value="create" />
              <div className="space-y-4">
                <Input
                  name="name"
                  label="Category Name"
                  placeholder="e.g., Business Applications"
                  isRequired
                  onChange={(e) => {
                    const slugInput = document.querySelector('input[name="slug"]') as HTMLInputElement;
                    if (slugInput && !slugInput.dataset.modified) {
                      slugInput.value = generateSlug(e.target.value);
                    }
                  }}
                />
                <Input
                  name="slug"
                  label="Slug"
                  placeholder="e.g., business-apps"
                  description="URL-friendly identifier"
                  isRequired
                  onChange={(e) => {
                    e.target.dataset.modified = "true";
                  }}
                />
                <Textarea
                  name="description"
                  label="Description"
                  placeholder="Brief description of this category"
                />
                <Select
                  name="icon"
                  label="Icon"
                  placeholder="Select icon"
                >
                  {availableIcons.map((iconName) => {
                    const IconComp = iconMap[iconName] || Folder;
                    return (
                      <SelectItem key={iconName} textValue={iconName}>
                        <div className="flex items-center gap-2">
                          <IconComp size={18} />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
                <Input
                  name="order"
                  type="number"
                  label="Display Order"
                  placeholder="0"
                  defaultValue="0"
                  description="Lower numbers appear first"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Create Category
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editCat} onClose={() => setEditCat(null)} size="lg">
        <ModalContent>
          {editCat && (
            <Form method="post" onSubmit={() => setEditCat(null)}>
              <ModalHeader>Edit Category</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="id" value={editCat._id.toString()} />
                <div className="space-y-4">
                  <Input
                    name="name"
                    label="Category Name"
                    defaultValue={editCat.name}
                    isRequired
                  />
                  <Input
                    name="slug"
                    label="Slug"
                    defaultValue={editCat.slug}
                    isRequired
                  />
                  <Textarea
                    name="description"
                    label="Description"
                    defaultValue={editCat.description || ""}
                  />
                  <Select
                    name="icon"
                    label="Icon"
                    defaultSelectedKeys={editCat.icon ? [editCat.icon] : []}
                  >
                    {availableIcons.map((iconName) => {
                      const IconComp = iconMap[iconName] || Folder;
                      return (
                        <SelectItem key={iconName} textValue={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComp size={18} />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </Select>
                  <Input
                    name="order"
                    type="number"
                    label="Display Order"
                    defaultValue={editCat.order.toString()}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      name="isActive"
                      value="true"
                      defaultSelected={editCat.isActive}
                    />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setEditCat(null)}>
                  Cancel
                </Button>
                <Button type="submit" color="primary" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <ModalContent>
          {deleteConfirm && (
            <Form method="post" onSubmit={() => setDeleteConfirm(null)}>
              <ModalHeader>Delete Category</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={deleteConfirm._id.toString()} />
                <input type="hidden" name="name" value={deleteConfirm.name} />
                {deleteConfirm.linkCount > 0 ? (
                  <p className="text-red-600">
                    Cannot delete category with {deleteConfirm.linkCount} app links.
                    Please reassign or remove app links first.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                    This action cannot be undone.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="danger"
                  isLoading={isSubmitting}
                  isDisabled={deleteConfirm.linkCount > 0}
                >
                  Delete
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
