/**
 * User Logout Route
 * Handles logout for both portal users (JWT) and admin users (session cookie)
 */

import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { logoutUser, getCurrentUser } = await import("~/lib/services/user-auth.server");
  const { getUser: getAdminUser, logout: adminLogout } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");

  await connectDB();

  // Check if this is a portal user (JWT auth)
  const portalUser = await getCurrentUser(request);
  if (portalUser?._id) {
    await logActivity({
      userId: portalUser._id.toString(),
      action: "logout",
      resource: "user_session",
      request,
    });

    const headers = await logoutUser(request);
    return redirect("/", { headers });
  }

  // Check if this is an admin user logged in via session cookie
  const adminUser = await getAdminUser(request);
  if (adminUser) {
    await logActivity({
      userId: adminUser._id.toString(),
      action: "logout",
      resource: "admin_session",
      request,
    });

    return adminLogout(request, "/");
  }

  // No user found, just redirect home
  return redirect("/");
}
