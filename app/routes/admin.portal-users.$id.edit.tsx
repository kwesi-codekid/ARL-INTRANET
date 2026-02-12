/**
 * Admin Edit Portal User Page
 * Form to edit existing employee/staff users
 */

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  Chip,
} from "@heroui/react";
import { Edit, ArrowLeft, Phone, Mail, Building2, Briefcase, MapPin, Shield, Calendar, LogIn } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, useNavigation, Link, redirect } from "react-router";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getUserById } = await import("~/lib/services/user.server");
  const { Department } = await import("~/lib/db/models/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const { id } = params;
  if (!id) {
    throw new Response("User ID required", { status: 400 });
  }

  const [user, departments] = await Promise.all([
    getUserById(id),
    Department.find({ isActive: true }).sort({ name: 1 }).lean(),
  ]);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return Response.json({
    user: {
      id: user._id.toString(),
      employeeId: user.employeeId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      department: user.department._id?.toString() || user.department.toString(),
      position: user.position,
      location: user.location,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin?.toISOString() || null,
      loginCount: user.loginCount,
      createdAt: user.createdAt?.toISOString() || null,
    },
    departments: departments.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      code: d.code,
    })),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { updateUser } = await import("~/lib/services/user.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const { id } = params;
  if (!id) {
    return Response.json({ error: "User ID required" }, { status: 400 });
  }

  const formData = await request.formData();

  const updates = {
    employeeId: formData.get("employeeId") as string || undefined,
    name: formData.get("name") as string,
    email: formData.get("email") as string || undefined,
    departmentId: formData.get("department") as string,
    position: formData.get("position") as string,
    location: formData.get("location") as "site" | "head-office",
    role: formData.get("role") as "user" | "manager" | "department_head",
  };

  // Validate required fields
  if (!updates.name || !updates.departmentId || !updates.position) {
    return Response.json(
      { error: "Name, department, and position are required" },
      { status: 400 }
    );
  }

  const result = await updateUser(id, updates);

  if (!result.success) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  // Log activity
  await logActivity({
    userId: sessionData?.userId,
    action: "update",
    resource: "portal_user",
    resourceId: id,
    details: { name: updates.name },
    request,
  });

  return redirect("/admin/portal-users");
}

export default function AdminEditPortalUserPage() {
  const { user, departments } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          as={Link}
          to="/admin/portal-users"
          variant="light"
          isIconOnly
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Portal User</h1>
          <p className="text-sm text-gray-500">Update employee account details</p>
        </div>
        <div className="flex gap-2">
          <Chip
            variant="dot"
            color={user.isActive ? "success" : "danger"}
          >
            {user.isActive ? "Active" : "Inactive"}
          </Chip>
          {user.isVerified && (
            <Chip variant="flat" color="primary">
              Phone Verified
            </Chip>
          )}
          {user.emailVerified && (
            <Chip variant="flat" color="secondary">
              Email Verified
            </Chip>
          )}
        </div>
      </div>

      {/* Error Message */}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {/* Form */}
      <Form method="post">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="shadow-sm">
            <CardHeader className="flex items-center gap-2">
              <Edit size={20} className="text-primary-500" />
              <h2 className="text-lg font-semibold">Personal Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                name="name"
                label="Full Name"
                placeholder="Enter employee name"
                defaultValue={user.name}
                isRequired
              />

              <Input
                name="employeeId"
                label="Employee ID"
                placeholder="e.g., ARL-001"
                defaultValue={user.employeeId || ""}
                description="Optional unique identifier"
              />

              <Input
                label="Phone Number"
                value={user.phone}
                isReadOnly
                description="Phone number cannot be changed"
                startContent={<Phone size={18} className="text-gray-400" />}
              />

              <Input
                name="email"
                type="email"
                label="Email Address"
                placeholder="name@arl.com"
                defaultValue={user.email || ""}
                description="Backup login method"
                startContent={<Mail size={18} className="text-gray-400" />}
              />
            </CardBody>
          </Card>

          {/* Work Information */}
          <Card className="shadow-sm">
            <CardHeader className="flex items-center gap-2">
              <Building2 size={20} className="text-primary-500" />
              <h2 className="text-lg font-semibold">Work Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                name="department"
                label="Department"
                placeholder="Select department"
                defaultSelectedKeys={[user.department]}
                isRequired
                startContent={<Building2 size={18} className="text-gray-400" />}
              >
                {departments.map((dept) => (
                  <SelectItem key={dept.id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </Select>

              <Input
                name="position"
                label="Position / Job Title"
                placeholder="e.g., Mining Engineer"
                defaultValue={user.position}
                isRequired
                startContent={<Briefcase size={18} className="text-gray-400" />}
              />

              <Select
                name="location"
                label="Work Location"
                placeholder="Select location"
                defaultSelectedKeys={[user.location]}
                isRequired
                startContent={<MapPin size={18} className="text-gray-400" />}
              >
                <SelectItem key="site">Site (Nzema)</SelectItem>
                <SelectItem key="head-office">Head Office (Accra)</SelectItem>
              </Select>

              <Divider className="my-2" />

              <Select
                name="role"
                label="Portal Role"
                placeholder="Select role"
                defaultSelectedKeys={[user.role]}
                isRequired
                description="Determines access level within the portal"
                startContent={<Shield size={18} className="text-gray-400" />}
              >
                <SelectItem key="user" description="Standard employee access">
                  User
                </SelectItem>
                <SelectItem key="manager" description="Team management access">
                  Manager
                </SelectItem>
                <SelectItem key="department_head" description="Department-wide access">
                  Department Head
                </SelectItem>
              </Select>
            </CardBody>
          </Card>

          {/* Account Information (Read-only) */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="flex items-center gap-2">
              <LogIn size={20} className="text-primary-500" />
              <h2 className="text-lg font-semibold">Account Activity</h2>
            </CardHeader>
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={20} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <LogIn size={20} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-sm font-medium">{formatDate(user.lastLogin)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield size={20} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Total Logins</p>
                    <p className="text-sm font-medium">{user.loginCount}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            as={Link}
            to="/admin/portal-users"
            variant="flat"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            isLoading={isSubmitting}
            startContent={!isSubmitting && <Edit size={18} />}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
