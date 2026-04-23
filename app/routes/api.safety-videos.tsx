/**
 * Safety Videos API Routes
 * Task: 1.2.2.1.5 - GET /api/safety-videos endpoint
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { connectDB } from "~/lib/db/connection.server";
import {
  getSafetyVideos,
  getFeaturedSafetyVideo,
  serializeSafetyVideo,
  incrementVideoViews,
} from "~/lib/services/safety.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await connectDB();

  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const featured = url.searchParams.get("featured") === "true";
  const typeParam = url.searchParams.get("type");
  const videoType: "safety" | "training" = typeParam === "training" ? "training" : "safety";

  // Return featured video for homepage widget
  if (featured) {
    const video = await getFeaturedSafetyVideo(videoType);
    return Response.json({
      video: video ? serializeSafetyVideo(video) : null,
    });
  }

  // Return paginated videos
  const result = await getSafetyVideos({
    category,
    search,
    page,
    limit,
    status: "published",
    videoType,
  });

  return Response.json({
    videos: result.videos.map(serializeSafetyVideo),
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "increment-views") {
    const videoId = formData.get("videoId") as string;
    if (videoId) {
      await incrementVideoViews(videoId);
      return Response.json({ success: true });
    }
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
