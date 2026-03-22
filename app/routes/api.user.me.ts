/**
 * Current User API
 * Returns authenticated user information
 */

import type { LoaderFunctionArgs } from "react-router";
import { getCurrentUser } from "~/lib/services/user-auth.server";
import { connectDB } from "~/lib/db/connection.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await connectDB();

  const user = await getCurrentUser(request);

  if (!user) {
    return Response.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Populate department info
  await user.populate("department", "name code");

  return Response.json({
    user: {
      id: user._id.toString(),
      employeeId: user.employeeId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      department: user.department,
      position: user.position,
      location: user.location,
      role: user.role,
      permissions: user.permissions,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin?.toISOString(),
      loginCount: user.loginCount,
    },
  });
}
