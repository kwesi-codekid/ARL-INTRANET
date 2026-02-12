/**
 * Photo Gallery Listing Page
 * Task: 1.3.1.3.4 - Create gallery listing page
 */

import {
  Card,
  CardBody,
  Button,
  Chip,
  Input,
} from "@heroui/react";
import { Camera, Search, Image as ImageIcon, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useSearchParams, useOutletContext } from "react-router";
import { useState } from "react";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";
import type { SerializedAlbum } from "~/lib/services/gallery.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { getAlbums, getFeaturedAlbums, serializeAlbum } = await import("~/lib/services/gallery.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");

  const [{ albums, total, pages }, featuredAlbums] = await Promise.all([
    getAlbums({ status: "published", search }, page, 12),
    getFeaturedAlbums(4),
  ]);

  return Response.json({
    albums: albums.map(serializeAlbum),
    featuredAlbums: featuredAlbums.map(serializeAlbum),
    total,
    pages,
    page,
    search: search || "",
  });
}

function AlbumCard({ album }: { album: SerializedAlbum }) {
  const albumDate = new Date(album.date);
  const formattedDate = albumDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // If it's an external gallery, link to the external URL
  const isExternal = album.isExternalGallery && album.externalGalleryUrl;
  const linkProps = isExternal
    ? { href: album.externalGalleryUrl!, target: "_blank", rel: "noopener noreferrer" }
    : { to: `/gallery/${album.slug}` };

  const CardWrapper = isExternal ? "a" : Link;

  return (
    <CardWrapper {...linkProps as any} className="group block">
      <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Image Section */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
          {album.coverImage ? (
            <img
              src={album.coverImage}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={48} className="text-gray-300" />
            </div>
          )}
          {/* Badges on image */}
          <div className="absolute top-2 left-2 flex gap-2">
            {album.isFeatured && (
              <Chip size="sm" color="warning" variant="solid">
                Featured
              </Chip>
            )}
            {isExternal && (
              <Chip size="sm" color="secondary" variant="solid" startContent={<ExternalLink size={10} />}>
                External
              </Chip>
            )}
          </div>
          <div className="absolute top-2 right-2">
            {!isExternal && (
              <Chip
                size="sm"
                variant="solid"
                className="bg-black/70 text-white"
                startContent={<Camera size={12} />}
              >
                {album.photoCount}
              </Chip>
            )}
          </div>
        </div>
        {/* Content Section - Solid Background */}
        <CardBody className="p-3 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
              {album.title}
            </h3>
            {isExternal && <ExternalLink size={14} className="text-gray-400 shrink-0" />}
          </div>
          {album.description && (
            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
              {album.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <Calendar size={11} />
            {formattedDate}
          </div>
        </CardBody>
      </Card>
    </CardWrapper>
  );
}

export default function GalleryPage() {
  const { albums, featuredAlbums, total, pages, page, search } = useLoaderData<{
    albums: SerializedAlbum[];
    featuredAlbums: SerializedAlbum[];
    total: number;
    pages: number;
    page: number;
    search: string;
  }>();
  const { portalUser } = useOutletContext<PublicOutletContext>();

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const showFeatured = !search && page === 1 && featuredAlbums.length > 0;
  const regularAlbums = showFeatured
    ? albums.filter((a) => !featuredAlbums.some((f) => f.id === a.id))
    : albums;

  return (
    <MainLayout user={portalUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
            <p className="text-gray-500">
              {total} {total === 1 ? "album" : "albums"} in our collection
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Camera size={24} className="text-primary-600" />
          </div>
        </div>

        {/* Search */}
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search albums..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={16} className="text-gray-400" />}
                classNames={{
                  inputWrapper: "bg-gray-50",
                }}
              />
              <Button type="submit" color="primary">
                Search
              </Button>
              {search && (
                <Button
                  variant="flat"
                  onClick={() => {
                    setSearchQuery("");
                    const params = new URLSearchParams(searchParams);
                    params.delete("search");
                    params.delete("page");
                    setSearchParams(params);
                  }}
                >
                  Clear
                </Button>
              )}
            </form>
          </CardBody>
        </Card>

        {/* Search Results Info */}
        {search && (
          <div className="text-sm text-gray-500">
            Showing {albums.length} results for "{search}"
          </div>
        )}

        {/* Featured Albums */}
        {showFeatured && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Albums</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredAlbums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </div>
        )}

        {/* All Albums */}
        <div>
          {showFeatured && regularAlbums.length > 0 && (
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Albums</h2>
          )}

          {albums.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(showFeatured ? regularAlbums : albums).map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    isDisabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            size="sm"
                            variant={p === page ? "solid" : "flat"}
                            color={p === page ? "primary" : "default"}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </Button>
                        </span>
                      ))}
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    isDisabled={page >= pages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="shadow-sm">
              <CardBody className="py-12 text-center">
                <Camera size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  {search ? "No albums found matching your search" : "No photo albums available yet"}
                </p>
                {search && (
                  <Button
                    variant="flat"
                    color="primary"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      const params = new URLSearchParams();
                      setSearchParams(params);
                    }}
                  >
                    View All Albums
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Events Link */}
        <Card className="shadow-sm bg-gradient-to-r from-primary-50 to-primary-100">
          <CardBody className="flex flex-row items-center justify-between p-6">
            <div>
              <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
              <p className="text-sm text-gray-600">
                Check out our upcoming company events and activities
              </p>
            </div>
            <Button
              as={Link}
              to="/events"
              color="primary"
              endContent={<ArrowRight size={16} />}
            >
              View Events
            </Button>
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
}
