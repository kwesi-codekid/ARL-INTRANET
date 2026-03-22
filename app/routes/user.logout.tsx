/**
 * User Logout Route
 * Handles logout for both portal users (JWT) and admin users (session cookie)
 */

import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { connectDB } from "~/lib/db/connection.server";
import { logoutUser, getCurrentUser } from "~/lib/services/user-auth.server";
import { getUser as getAdminUser, logout as adminLogout } from "~/lib/services/session.server";
import { logActivity } from "~/lib/services/activity-log.server";

export async function loader({ request }: LoaderFunctionArgs) {
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
