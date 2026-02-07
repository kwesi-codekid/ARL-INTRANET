/**
 * Quick Links API Route
 * Task: 1.1.5.2.5
 * Provides data for the homepage quick links widget
 */

import type { LoaderFunctionArgs } from "react-router";
import { connectDB } from "~/lib/db/connection.server";
import { AppLink } from "~/lib/db/models/app-link.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await connectDB();

  // Get top 5 most clicked active app links
  const quickLinks = await AppLink.find({ isActive: true })
    .sort({ clicks: -1, name: 1 })
    .limit(5)
    .lean();

  return Response.json({
    quickLinks: quickLinks.map((link) => ({
      _id: link._id.toString(),
      name: link.name,
      url: link.url,
      icon: link.icon,
      iconType: link.iconType,
      isInternal: link.isInternal,
      clicks: link.clicks,
    })),
  });
}
