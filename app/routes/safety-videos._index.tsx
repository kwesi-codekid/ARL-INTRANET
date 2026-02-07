/**
 * Safety Videos Gallery Page
 * Task: 1.2.2.3.1 - Create safety videos gallery page
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Input,
  Tabs,
  Tab,
  Pagination,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { Search, Video, Play, Eye, Clock, X } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";
import { VideoPlayer } from "~/components/ui";
import type { SerializedSafetyVideo, SerializedSafetyCategory } from "~/lib/services/safety.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { getSafetyVideos, getSafetyCategories, serializeSafetyVideo, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const categories = await getSafetyCategories(true);
  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  const result = await getSafetyVideos({
    category: selectedCategory?._id.toString(),
    search,
    page,
    limit: 12,
    status: "published",
  });

  return Response.json({
    videos: result.videos.map(serializeSafetyVideo),
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    categories: categories.map(serializeSafetyCategory),
    selectedCategory: categorySlug || "all",
    searchQuery: search || "",
  });
}

interface LoaderData {
  videos: SerializedSafetyVideo[];
  total: number;
  page: number;
  totalPages: number;
  categories: SerializedSafetyCategory[];
  selectedCategory: string;
  searchQuery: string;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function SafetyVideosPage() {
  const { videos, total, page, totalPages, categories, selectedCategory, searchQuery } =
    useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [search, setSearch] = useState(searchQuery);
  const [selectedVideo, setSelectedVideo] = useState<SerializedSafetyVideo | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleVideoClick = (video: SerializedSafetyVideo) => {
    setSelectedVideo(video);
    onOpen();
  };

  return (
    <MainLayout user={portalUser}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Video size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Videos</h1>
            <p className="text-gray-500">Watch and learn important safety procedures</p>
          </div>
        </div>
      </div>

      {/* Search and Filter - Task: 1.2.2.3.5 */}
      <Card className="mb-6 shadow-sm">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" className="flex-1 max-w-md">
            <Input
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              name="search"
              startContent={<Search size={18} className="text-gray-400" />}
              classNames={{
                inputWrapper: "bg-gray-50",
              }}
            />
            {selectedCategory !== "all" && (
              <input type="hidden" name="category" value={selectedCategory} />
            )}
          </form>
          <div className="text-sm text-gray-500">{total} videos available</div>
        </CardBody>
      </Card>

      {/* Category Tabs - Task: 1.2.2.3.4 */}
      <div className="mb-6 overflow-x-auto">
        <Tabs
          selectedKey={selectedCategory}
          onSelectionChange={(key) => {
            const params = new URLSearchParams();
            if (key !== "all") params.set("category", key.toString());
            if (search) params.set("search", search);
            window.location.href = `/safety-videos?${params.toString()}`;
          }}
          variant="underlined"
          color="primary"
          classNames={{
            tabList: "gap-4",
          }}
        >
          <Tab key="all" title="All Videos" />
          {categories.map((category) => (
            <Tab
              key={category.slug}
              title={
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* Video Grid - Task: 1.2.2.3.2 */}
      {videos.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="py-12 text-center">
            <Video size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No videos found</h3>
            <p className="text-gray-500">
              {search ? "Try adjusting your search" : "Check back later for safety videos"}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              isPressable
              onPress={() => handleVideoClick(video)}
            >
              {/* Thumbnail Section */}
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
                    <Video size={48} className="text-blue-300" />
                  </div>
                )}
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 group-hover:bg-black/70 transition-colors">
                    <Play size={28} className="text-white ml-1" />
                  </div>
                </div>
                {/* Category badge on image */}
                {video.category && (
                  <div className="absolute top-2 left-2">
                    <Chip
                      size="sm"
                      variant="solid"
                      style={{ backgroundColor: video.category.color }}
                      className="text-white"
                    >
                      {video.category.name}
                    </Chip>
                  </div>
                )}
                {/* Duration Badge */}
                {video.duration > 0 && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className="absolute top-2 right-2 bg-black/70 text-white"
                  >
                    {formatDuration(video.duration)}
                  </Chip>
                )}
              </div>
              {/* Content Section - Solid Background */}
              <CardBody className="p-3 bg-white">
                <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{video.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{video.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {video.views} views
                  </span>
                  {video.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={(newPage) => {
              const params = new URLSearchParams();
              if (selectedCategory !== "all") params.set("category", selectedCategory);
              if (search) params.set("search", search);
              params.set("page", newPage.toString());
              window.location.href = `/safety-videos?${params.toString()}`;
            }}
            color="primary"
          />
        </div>
      )}

      {/* Video Player Modal - Task: 1.2.2.3.3 */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        classNames={{
          base: "bg-black",
          closeButton: "text-white hover:bg-white/20 z-50",
        }}
      >
        <ModalContent>
          {selectedVideo && (
            <ModalBody className="p-0">
              <VideoPlayer
                src={selectedVideo.videoUrl}
                title={selectedVideo.title}
                autoPlay={true}
              />
              <div className="p-4 bg-gray-900 text-white">
                <h3 className="font-semibold text-lg">{selectedVideo.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{selectedVideo.description}</p>
              </div>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </MainLayout>
  );
}
