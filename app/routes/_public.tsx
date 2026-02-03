/**
 * Public Layout Wrapper
 * Handles maintenance mode check for all public routes
 */

import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";
import { MaintenancePage } from "~/components/ui";

interface LoaderData {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  isAdmin: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { isMaintenanceMode, getMaintenanceMessage } = await import(
    "~/lib/services/settings.server"
  );
  const { getUser } = await import("~/lib/services/session.server");

  await connectDB();

  // Check maintenance mode
  const maintenanceEnabled = await isMaintenanceMode();
  const maintenanceMessage = await getMaintenanceMessage();

  // Check if current user is admin (admins can bypass maintenance)
  let isAdmin = false;
  try {
    const user = await getUser(request);
    isAdmin = !!user;
  } catch {
    isAdmin = false;
  }

  return Response.json({
    isMaintenanceMode: maintenanceEnabled,
    maintenanceMessage,
    isAdmin,
  });
}

export default function PublicLayout() {
  const { isMaintenanceMode, maintenanceMessage, isAdmin } =
    useLoaderData<LoaderData>();

  // Show maintenance page if enabled and user is not admin
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage message={maintenanceMessage} showAdminLink />;
  }

  // Render child routes normally
  return <Outlet />;
}
