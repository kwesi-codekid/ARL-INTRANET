/**
 * Public Layout Wrapper
 * Handles maintenance mode check for all public routes
 * Also provides portal user context to child routes
 */

import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";
import { MaintenancePage } from "~/components/ui";
import type { PortalUser } from "~/components/layout";
import { connectDB } from "~/lib/db/connection.server";
import { isMaintenanceMode, getMaintenanceMessage } from "~/lib/services/settings.server";
import { getUser } from "~/lib/services/session.server";
import { getCurrentUser } from "~/lib/services/user-auth.server";

interface LoaderData {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  isAdmin: boolean;
  portalUser: PortalUser | null;
}

export interface PublicOutletContext {
  portalUser: PortalUser | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await connectDB();

  // Check maintenance mode
  const maintenanceEnabled = await isMaintenanceMode();
  const maintenanceMessage = await getMaintenanceMessage();

  // Check if current user is admin (admins can bypass maintenance)
  let isAdmin = false;
  let adminUser = null;
  try {
    adminUser = await getUser(request);
    isAdmin = !!adminUser;
  } catch {
    isAdmin = false;
  }

  // Get current portal user (for header display)
  let portalUser: PortalUser | null = null;
  try {
    const user = await getCurrentUser(request);
    if (user) {
      portalUser = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        position: user.position,
      };
    } else if (adminUser) {
      // Admins browsing public pages — show their admin identity
      portalUser = {
        id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email || "",
        position: "Administrator",
      };
    }
  } catch {
    portalUser = null;
  }

  return Response.json({
    isMaintenanceMode: maintenanceEnabled,
    maintenanceMessage,
    isAdmin,
    portalUser,
  });
}

export default function PublicLayout() {
  const { isMaintenanceMode, maintenanceMessage, isAdmin, portalUser } =
    useLoaderData<LoaderData>();

  // Show maintenance page if enabled and user is not admin
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage message={maintenanceMessage} showAdminLink />;
  }

  // Render child routes with portal user context
  const context: PublicOutletContext = { portalUser };
  return <Outlet context={context} />;
}
