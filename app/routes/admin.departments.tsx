/**
 * Admin Department Management
 * Task: 1.1.4.3.2
 */

import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Form, useNavigation, useActionData } from "react-router";
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
import { Plus, Edit, Trash2, Building2, Users } from "lucide-react";





import type { IDepartment } from "~/lib/db/models/contact.server";

// Type definitions
interface DepartmentWithCount extends IDepartment {
  contactCount: number;
}

interface DepartmentStats {
  total: number;
  byCategory: Record<string, number>;
}

interface LoaderData {
  departments: DepartmentWithCount[];
  stats: DepartmentStats;
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

const CATEGORIES = [
  { key: "operations", label: "Operations" },
  { key: "support", label: "Support" },
  { key: "hse", label: "HSE & Safety" },
  { key: "dfsl", label: "DFSL" },
  { key: "contractors", label: "Contractors" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { getDepartments, createDepartment, updateDepartment, deleteDepartment, getDepartmentStats } = await import("~/lib/services/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Contact } = await import("~/lib/db/models/contact.server");

  await requireAuth(request);
  await connectDB();

  const [departments, stats] = await Promise.all([
    getDepartments({ includeInactive: true }),
    getDepartmentStats(),
  ]);

  // Get contact counts per department
  const contactCounts = await Contact.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    contactCounts.map((c) => [c._id.toString(), c.count])
  );

  const departmentsWithCounts = departments.map((dept) => ({
    ...JSON.parse(JSON.stringify(dept)),
    contactCount: countMap.get(dept._id.toString()) || 0,
  }));

  return Response.json({
    departments: departmentsWithCounts,
    stats,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { getDepartments, createDepartment, updateDepartment, deleteDepartment, getDepartmentStats } = await import("~/lib/services/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Contact } = await import("~/lib/db/models/contact.server");

  await requireAuth(request);
  await connectDB();

  const sessionData = await getSessionData(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Create Department
  if (intent === "create") {
    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      category: formData.get("category") as "operations" | "support" | "hse" | "dfsl" | "contractors",
      description: formData.get("description") as string || undefined,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: true,
    };

    if (!data.name || !data.code || !data.category) {
      return Response.json({ error: "Name, code, and category are required" });
    }

    try {
      const department = await createDepartment(data);

      await logActivity({
        userId: sessionData?.userId,
        action: "create",
        resource: "department",
        resourceId: department._id.toString(),
        details: { name: data.name, code: data.code },
        request,
      });

      return Response.json({ success: true, message: "Department created successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return Response.json({ error: "Department code already exists" });
      }
      throw error;
    }
  }

  // Update Department
  if (intent === "update") {
    const id = formData.get("id") as string;
    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      category: formData.get("category") as "operations" | "support" | "hse" | "dfsl" | "contractors",
      description: formData.get("description") as string || undefined,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: formData.get("isActive") === "true",
    };

    try {
      await updateDepartment(id, data);

      await logActivity({
        userId: sessionData?.userId,
        action: "update",
        resource: "department",
        resourceId: id,
        details: { name: data.name, code: data.code },
        request,
      });

      return Response.json({ success: true, message: "Department updated successfully" });
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return Response.json({ error: "Department code already exists" });
      }
      throw error;
    }
  }

  // Delete Department
  if (intent === "delete") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;

    try {
      await deleteDepartment(id);

      await logActivity({
        userId: sessionData?.userId,
        action: "delete",
        resource: "department",
        resourceId: id,
        details: { name },
        request,
      });

      return Response.json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        return Response.json({ error: error.message });
      }
      throw error;
    }
  }

  return Response.json({ error: "Invalid action" });
}

interface DepartmentWithCount extends IDepartment {
  contactCount: number;
}

export default function AdminDepartments() {
  const { departments, stats } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentWithCount | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DepartmentWithCount | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "operations":
        return "primary";
      case "support":
        return "secondary";
      case "hse":
        return "success";
      case "dfsl":
        return "warning";
      case "contractors":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-primary-100 p-3">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Departments</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardBody>
        </Card>

        {CATEGORIES.map((cat) => (
          <Card key={cat.key}>
            <CardBody>
              <p className="text-sm text-gray-500">{cat.label}</p>
              <p className="text-xl font-bold">{stats.byCategory[cat.key] || 0}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Departments</h2>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={() => setIsCreateOpen(true)}
        >
          Add Department
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

      {/* Departments Table */}
      <Card>
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Departments table" removeWrapper className="min-w-[500px]">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>CODE</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>CONTACTS</TableColumn>
              <TableColumn>ORDER</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No departments found">
              {departments.map((dept: DepartmentWithCount) => (
                <TableRow key={dept._id.toString()}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      {dept.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                      {dept.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={getCategoryColor(dept.category)}
                      variant="flat"
                      className="capitalize"
                    >
                      {dept.category}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span>{dept.contactCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>{dept.order}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={dept.isActive ? "success" : "default"}
                      variant="flat"
                    >
                      {dept.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => setEditDept(dept)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        isDisabled={dept.contactCount > 0}
                        onPress={() => setDeleteConfirm(dept)}
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
            <ModalHeader>Add New Department</ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value="create" />
              <div className="space-y-4">
                <Input
                  name="name"
                  label="Department Name"
                  placeholder="e.g., Mining Operations"
                  isRequired
                />
                <Input
                  name="code"
                  label="Department Code"
                  placeholder="e.g., MINE"
                  description="Unique identifier, will be uppercased"
                  isRequired
                />
                <Select
                  name="category"
                  label="Category"
                  placeholder="Select category"
                  isRequired
                >
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.key} textValue={cat.label}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </Select>
                <Textarea
                  name="description"
                  label="Description"
                  placeholder="Brief description of the department"
                />
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
                Create Department
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editDept} onClose={() => setEditDept(null)} size="lg">
        <ModalContent>
          {editDept && (
            <Form method="post" onSubmit={() => setEditDept(null)}>
              <ModalHeader>Edit Department</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="id" value={editDept._id.toString()} />
                <div className="space-y-4">
                  <Input
                    name="name"
                    label="Department Name"
                    defaultValue={editDept.name}
                    isRequired
                  />
                  <Input
                    name="code"
                    label="Department Code"
                    defaultValue={editDept.code}
                    isRequired
                  />
                  <Select
                    name="category"
                    label="Category"
                    defaultSelectedKeys={[editDept.category]}
                    isRequired
                  >
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.key} textValue={cat.label}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Textarea
                    name="description"
                    label="Description"
                    defaultValue={editDept.description || ""}
                  />
                  <Input
                    name="order"
                    type="number"
                    label="Display Order"
                    defaultValue={editDept.order.toString()}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      name="isActive"
                      value="true"
                      defaultSelected={editDept.isActive}
                    />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setEditDept(null)}>
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
              <ModalHeader>Delete Department</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={deleteConfirm._id.toString()} />
                <input type="hidden" name="name" value={deleteConfirm.name} />
                {deleteConfirm.contactCount > 0 ? (
                  <p className="text-red-600">
                    Cannot delete department with {deleteConfirm.contactCount} contacts.
                    Please reassign or remove contacts first.
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
                  isDisabled={deleteConfirm.contactCount > 0}
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
