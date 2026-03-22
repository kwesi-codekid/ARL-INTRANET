/**
 * Admin Users Management (Superadmin Only)
 * Task: 1.1.2.4.3, 1.1.2.4.5
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
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { UserPlus, Search, Edit, Trash2, UserCog } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, useNavigation } from "react-router";






export async function loader({ request }: LoaderFunctionArgs) {
  const { requireSuperAdmin, getSessionData } = await import("~/lib/services/session.server");
  const { formatGhanaPhone, isValidGhanaPhone } = await import("~/lib/services/sms.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { AdminUser } = await import("~/lib/db/models/admin-user.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireSuperAdmin(request);
  await connectDB();

  const users = await AdminUser.find().sort({ createdAt: -1 }).lean();

  return Response.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt?.toISOString() || null,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireSuperAdmin, getSessionData } = await import("~/lib/services/session.server");
  const { formatGhanaPhone, isValidGhanaPhone } = await import("~/lib/services/sms.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { AdminUser } = await import("~/lib/db/models/admin-user.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  const currentUser = await requireSuperAdmin(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Create new admin
  if (intent === "create") {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const role = formData.get("role") as "admin" | "superadmin";

    if (!name || !phone || !role) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!isValidGhanaPhone(phone)) {
      return Response.json({ error: "Invalid Ghana phone number" }, { status: 400 });
    }

    const formattedPhone = formatGhanaPhone(phone);

    // Check if phone already exists
    const existing = await AdminUser.findOne({ phone: formattedPhone });
    if (existing) {
      return Response.json({ error: "Phone number already registered" }, { status: 400 });
    }

    const newUser = await AdminUser.create({
      name,
      phone: formattedPhone,
      role,
      isActive: true,
    });

    await logActivity({
      userId: sessionData?.userId,
      action: "create",
      resource: "admin_user",
      resourceId: newUser._id.toString(),
      details: { name, phone: formattedPhone, role },
      request,
    });

    return Response.json({ success: true, message: "Admin user created" });
  }

  // Update admin user
  if (intent === "update") {
    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as "admin" | "superadmin";

    if (!name || !role) {
      return Response.json({ error: "Name and role are required" }, { status: 400 });
    }

    const user = await AdminUser.findById(userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const oldData = { name: user.name, role: user.role };
    user.name = name;
    user.role = role;
    await user.save();

    await logActivity({
      userId: sessionData?.userId,
      action: "update",
      resource: "admin_user",
      resourceId: userId,
      details: { oldData, newData: { name, role } },
      request,
    });

    return Response.json({ success: true, message: "Admin user updated" });
  }

  // Toggle active status
  if (intent === "toggle-status") {
    const userId = formData.get("userId") as string;

    const user = await AdminUser.findById(userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logActivity({
      userId: sessionData?.userId,
      action: user.isActive ? "activate" : "deactivate",
      resource: "admin_user",
      resourceId: userId,
      details: { userName: user.name },
      request,
    });

    return Response.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}` });
  }

  // Delete user
  if (intent === "delete") {
    const userId = formData.get("userId") as string;

    const user = await AdminUser.findById(userId);
    if (user) {
      await logActivity({
        userId: sessionData?.userId,
        action: "delete",
        resource: "admin_user",
        resourceId: userId,
        details: { userName: user.name, phone: user.phone },
        request,
      });
    }

    await AdminUser.findByIdAndDelete(userId);

    return Response.json({ success: true, message: "User deleted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminUsersPage() {
  const { users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);

  const openEditModal = (user: typeof users[0]) => {
    setEditingUser(user);
    onEditOpen();
  };

  const handleEditClose = () => {
    setEditingUser(null);
    onEditClose();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-sm text-gray-500">
            Manage admin portal access
          </p>
        </div>
        <Button
          color="primary"
          startContent={<UserPlus size={18} />}
          onPress={onOpen}
        >
          Add Admin
        </Button>
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

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserCog size={20} className="text-primary-500" />
            <h2 className="text-lg font-semibold">All Admins ({users.length})</h2>
          </div>
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-xs"
          />
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Admin users table" removeWrapper className="min-w-[600px]">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>PHONE</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>LAST LOGIN</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No admin users found">
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={user.role === "superadmin" ? "warning" : "primary"}
                    >
                      {user.role}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="dot"
                      color={user.isActive ? "success" : "danger"}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(user.lastLogin)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => openEditModal(user)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle-status" />
                        <input type="hidden" name="userId" value={user.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="light"
                          isLoading={isSubmitting}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="userId" value={user.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          isLoading={isSubmitting}
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

      {/* Add Admin Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <Form method="post" onSubmit={() => onClose()}>
            <ModalHeader>Add New Admin</ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value="create" />
              <div className="space-y-4">
                <Input
                  name="name"
                  label="Full Name"
                  placeholder="Enter full name"
                  isRequired
                />
                <Input
                  name="phone"
                  type="tel"
                  label="Phone Number"
                  placeholder="0241234567"
                  description="Ghana phone number"
                  isRequired
                />
                <Select
                  name="role"
                  label="Role"
                  placeholder="Select role"
                  isRequired
                >
                  <SelectItem key="admin">Admin</SelectItem>
                  <SelectItem key="superadmin">Superadmin</SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Create Admin
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal isOpen={isEditOpen} onClose={handleEditClose}>
        <ModalContent>
          <Form method="post" onSubmit={() => handleEditClose()}>
            <ModalHeader>Edit Admin User</ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value="update" />
              <input type="hidden" name="userId" value={editingUser?.id || ""} />
              <div className="space-y-4">
                <Input
                  name="name"
                  label="Full Name"
                  placeholder="Enter full name"
                  defaultValue={editingUser?.name}
                  isRequired
                />
                <Input
                  label="Phone Number"
                  value={editingUser?.phone || ""}
                  isReadOnly
                  description="Phone number cannot be changed"
                />
                <Select
                  name="role"
                  label="Role"
                  defaultSelectedKeys={editingUser ? [editingUser.role] : []}
                  isRequired
                >
                  <SelectItem key="admin">Admin</SelectItem>
                  <SelectItem key="superadmin">Superadmin</SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleEditClose}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Update Admin
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}
