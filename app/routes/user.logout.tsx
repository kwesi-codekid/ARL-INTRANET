/**
 * User Logout Route
 * Logs out portal users and redirects to home
 */

import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { logoutUser, getCurrentUser } = await import("~/lib/services/user-auth.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");

  await connectDB();

  const user = await getCurrentUser(request);

  if (user?._id) {
    await logActivity({
      userId: user._id.toString(),
      action: "logout",
      resource: "user_session",
      request,
    });
  }

  const headers = await logoutUser(request);

  return redirect("/", { headers });
}
