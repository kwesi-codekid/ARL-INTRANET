/**
 * Admin Portal Users Management
 * List, search, and manage portal users (employees)
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
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import { UserPlus, Search, Edit, Users, Building2, MapPin } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, useNavigation, Link, useSearchParams } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { listUsers, getUserStats } = await import("~/lib/services/user.server");
  const { Department } = await import("~/lib/db/models/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || undefined;
  const departmentId = url.searchParams.get("department") || undefined;
  const role = url.searchParams.get("role") as "user" | "manager" | "department_head" | undefined;
  const location = url.searchParams.get("location") as "site" | "head-office" | undefined;
  const status = url.searchParams.get("status");

  const isActive = status === "active" ? true : status === "inactive" ? false : undefined;

  const [usersResult, stats, departments] = await Promise.all([
    listUsers({ page, limit: 20, search, departmentId, role, location, isActive }),
    getUserStats(),
    Department.find({ isActive: true }).sort({ name: 1 }).lean(),
  ]);

  return Response.json({
    users: usersResult.users.map((user) => ({
      id: user._id.toString(),
      employeeId: user.employeeId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      department: user.department,
      position: user.position,
      location: user.location,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin?.toISOString() || null,
      createdAt: user.createdAt?.toISOString() || null,
    })),
    pagination: {
      page: usersResult.page,
      limit: usersResult.limit,
      total: usersResult.total,
      totalPages: usersResult.totalPages,
    },
    stats,
    departments: departments.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      code: d.code,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { toggleUserStatus, deleteUser } = await import("~/lib/services/user.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId") as string;

  if (intent === "toggle-status") {
    const result = await toggleUserStatus(userId);

    if (result.success && result.user) {
      await logActivity({
        userId: sessionData?.userId,
        action: result.user.isActive ? "activate" : "deactivate",
        resource: "portal_user",
        resourceId: userId,
        details: { userName: result.user.name },
        request,
      });
    }

    return Response.json(result);
  }

  if (intent === "delete") {
    const { User } = await import("~/lib/db/models/user.server");
    const user = await User.findById(userId);

    if (user) {
      await logActivity({
        userId: sessionData?.userId,
        action: "delete",
        resource: "portal_user",
        resourceId: userId,
        details: { userName: user.name, phone: user.phone },
        request,
      });
    }

    const result = await deleteUser(userId, true);
    return Response.json(result);
  }

  return Response.json({ success: false, message: "Invalid action" }, { status: 400 });
}

export default function AdminPortalUsersPage() {
  const { users, pagination, stats, departments } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set("search", searchQuery);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const roleColors: Record<string, "primary" | "secondary" | "warning"> = {
    user: "primary",
    manager: "secondary",
    department_head: "warning",
  };

  const roleLabels: Record<string, string> = {
    user: "User",
    manager: "Manager",
    department_head: "Dept Head",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Users</h1>
          <p className="text-sm text-gray-500">Manage employee access to the portal</p>
        </div>
        <Button
          as={Link}
          to="/admin/portal-users/new"
          color="primary"
          startContent={<UserPlus size={18} />}
        >
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Verified</p>
            <p className="text-2xl font-bold text-blue-600">{stats.verified}</p>
          </CardBody>
        </Card>
      </div>

      {/* Action Messages */}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{actionData.error}</div>
      )}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{actionData.message}</div>
      )}

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <form onSubmit={handleSearch} className="flex-1">
              <Input
                placeholder="Search by name, phone, email, or ID..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={18} className="text-gray-400" />}
                endContent={
                  <Button type="submit" size="sm" color="primary" isIconOnly>
                    <Search size={16} />
                  </Button>
                }
              />
            </form>

            <Select
              placeholder="Department"
              selectedKeys={searchParams.get("department") ? [searchParams.get("department")!] : []}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="w-full sm:w-48"
              startContent={<Building2 size={16} className="text-gray-400" />}
            >
              {departments.map((dept) => (
                <SelectItem key={dept.id}>{dept.name}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Role"
              selectedKeys={searchParams.get("role") ? [searchParams.get("role")!] : []}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="w-full sm:w-36"
            >
              <SelectItem key="user">User</SelectItem>
              <SelectItem key="manager">Manager</SelectItem>
              <SelectItem key="department_head">Dept Head</SelectItem>
            </Select>

            <Select
              placeholder="Location"
              selectedKeys={searchParams.get("location") ? [searchParams.get("location")!] : []}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="w-full sm:w-36"
              startContent={<MapPin size={16} className="text-gray-400" />}
            >
              <SelectItem key="site">Site</SelectItem>
              <SelectItem key="head-office">Head Office</SelectItem>
            </Select>

            <Select
              placeholder="Status"
              selectedKeys={searchParams.get("status") ? [searchParams.get("status")!] : []}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full sm:w-32"
            >
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="inactive">Inactive</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex items-center gap-2">
          <Users size={20} className="text-primary-500" />
          <h2 className="text-lg font-semibold">
            Users ({pagination.total})
          </h2>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Portal users table" removeWrapper className="min-w-[700px]">
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>CONTACT</TableColumn>
              <TableColumn>DEPARTMENT</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>LAST LOGIN</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No users found">
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      {user.employeeId && (
                        <p className="text-xs text-gray-400">{user.employeeId}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{user.phone}</p>
                      {user.email && <p className="text-gray-400">{user.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {typeof user.department === "object" && user.department?.name
                          ? user.department.name
                          : "-"}
                      </p>
                      <p className="text-xs text-gray-400">{user.position}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={roleColors[user.role] || "default"}>
                      {roleLabels[user.role] || user.role}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color={user.location === "site" ? "success" : "secondary"}>
                      {user.location === "site" ? "Site" : "Head Office"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Chip size="sm" variant="dot" color={user.isActive ? "success" : "danger"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Chip>
                      {user.isVerified && (
                        <Chip size="sm" variant="flat" color="primary" className="text-xs">
                          Verified
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {formatDate(user.lastLogin)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        as={Link}
                        to={`/admin/portal-users/${user.id}/edit`}
                        size="sm"
                        variant="light"
                        isIconOnly
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
                          color={user.isActive ? "warning" : "success"}
                          isLoading={isSubmitting}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </Form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center p-4 border-t">
              <Pagination
                total={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
