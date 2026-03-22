/**
 * Admin Create Portal User Page
 * Form to create new employee/staff users
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
} from "@heroui/react";
import { UserPlus, ArrowLeft, Phone, Mail, Building2, Briefcase, MapPin, Shield } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, useNavigation, Link, redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { Department } = await import("~/lib/db/models/contact.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const departments = await Department.find({ isActive: true }).sort({ name: 1 }).lean();

  return Response.json({
    departments: departments.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      code: d.code,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { createUser } = await import("~/lib/services/user.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  const currentUser = await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();

  const userData = {
    employeeId: formData.get("employeeId") as string || undefined,
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string || undefined,
    departmentId: formData.get("department") as string,
    position: formData.get("position") as string,
    location: formData.get("location") as "site" | "head-office",
    role: formData.get("role") as "user" | "manager" | "department_head",
    createdBy: currentUser._id.toString(),
  };

  // Validate required fields
  if (!userData.name || !userData.phone || !userData.departmentId || !userData.position) {
    return Response.json(
      { error: "Name, phone, department, and position are required" },
      { status: 400 }
    );
  }

  const result = await createUser(userData);

  if (!result.success) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  // Log activity
  await logActivity({
    userId: sessionData?.userId,
    action: "create",
    resource: "portal_user",
    resourceId: result.user?._id.toString(),
    details: { name: userData.name, phone: userData.phone },
    request,
  });

  return redirect("/admin/portal-users");
}

export default function AdminNewPortalUserPage() {
  const { departments } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Portal User</h1>
          <p className="text-sm text-gray-500">Create a new employee account</p>
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
              <UserPlus size={20} className="text-primary-500" />
              <h2 className="text-lg font-semibold">Personal Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                name="name"
                label="Full Name"
                placeholder="Enter employee name"
                isRequired
                startContent={<UserPlus size={18} className="text-gray-400" />}
              />

              <Input
                name="employeeId"
                label="Employee ID"
                placeholder="e.g., ARL-001"
                description="Optional unique identifier"
              />

              <Input
                name="phone"
                type="tel"
                label="Phone Number"
                placeholder="0241234567"
                description="Ghana phone number (primary login method)"
                isRequired
                startContent={<Phone size={18} className="text-gray-400" />}
              />

              <Input
                name="email"
                type="email"
                label="Email Address"
                placeholder="name@arl.com"
                description="Optional (backup login method)"
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
                isRequired
                startContent={<Briefcase size={18} className="text-gray-400" />}
              />

              <Select
                name="location"
                label="Work Location"
                placeholder="Select location"
                defaultSelectedKeys={["site"]}
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
                defaultSelectedKeys={["user"]}
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
            startContent={!isSubmitting && <UserPlus size={18} />}
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
