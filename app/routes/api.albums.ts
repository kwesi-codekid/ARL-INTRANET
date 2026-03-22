/**
 * Albums API Route
 * Task: 1.3.1.2 - Photo Gallery Backend
 */

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getAlbums, getFeaturedAlbums, getAlbumsByEvent, serializeAlbum } =
    await import("~/lib/services/gallery.server");

  await connectDB();

  const url = new URL(request.url);
  const featured = url.searchParams.get("featured") === "true";
  const eventId = url.searchParams.get("event") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "12");
  const page = parseInt(url.searchParams.get("page") || "1");

  // Quick endpoint for featured albums
  if (featured && !eventId && !search) {
    const albums = await getFeaturedAlbums(limit);
    return Response.json({
      albums: albums.map(serializeAlbum),
    });
  }

  // Get albums by event
  if (eventId) {
    const albums = await getAlbumsByEvent(eventId);
    return Response.json({
      albums: albums.map(serializeAlbum),
    });
  }

  const { albums, total, pages } = await getAlbums(
    {
      status: "published",
      search,
    },
    page,
    limit
  );

  return Response.json({
    albums: albums.map(serializeAlbum),
    total,
    pages,
    page,
  });
}
