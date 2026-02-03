/**
 * Album Detail Page with Photo Lightbox
 * Task: 1.3.1.3.5 - Create album detail page with lightbox
 */

import {
  Card,
  CardBody,
  Button,
  Chip,
  Image,
  Modal,
  ModalContent,
  ModalBody,
} from "@heroui/react";
import {
  ArrowLeft,
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { MainLayout } from "~/components/layout";
import { connectDB } from "~/lib/db/connection.server";
import {
  getAlbumBySlug,
  getPhotosByAlbum,
  serializeAlbum,
  serializePhoto,
  type SerializedAlbum,
  type SerializedPhoto,
} from "~/lib/services/gallery.server";

export async function loader({ params }: LoaderFunctionArgs) {
  await connectDB();

  const album = await getAlbumBySlug(params.slug!);

  if (!album) {
    throw new Response("Album not found", { status: 404 });
  }

  const { photos } = await getPhotosByAlbum(album._id.toString(), 1, 500);

  return Response.json({
    album: serializeAlbum(album),
    photos: photos.map(serializePhoto),
  });
}

function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: {
  photos: SerializedPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const photo = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < photos.length - 1) {
        onNavigate(currentIndex + 1);
      }
    },
    [currentIndex, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="full"
      classNames={{
        wrapper: "bg-black/95",
        base: "bg-transparent shadow-none max-w-none m-0",
        body: "p-0",
        closeButton: "hidden",
      }}
      hideCloseButton
    >
      <ModalContent>
        <ModalBody className="relative flex items-center justify-center h-screen">
          {/* Close Button */}
          <Button
            isIconOnly
            variant="flat"
            className="absolute top-4 right-4 z-50 bg-white/10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X size={24} />
          </Button>

          {/* Navigation */}
          {currentIndex > 0 && (
            <Button
              isIconOnly
              variant="flat"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 text-white hover:bg-white/20"
              onClick={() => onNavigate(currentIndex - 1)}
            >
              <ChevronLeft size={32} />
            </Button>
          )}

          {currentIndex < photos.length - 1 && (
            <Button
              isIconOnly
              variant="flat"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 text-white hover:bg-white/20"
              onClick={() => onNavigate(currentIndex + 1)}
            >
              <ChevronRight size={32} />
            </Button>
          )}

          {/* Photo */}
          <div className="max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={photo.url}
              alt={photo.caption || `Photo ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>

          {/* Caption and Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="max-w-5xl mx-auto flex items-end justify-between">
              <div className="text-white">
                {photo.caption && (
                  <p className="text-lg mb-1">{photo.caption}</p>
                )}
                <p className="text-sm text-gray-300">
                  {currentIndex + 1} of {photos.length}
                </p>
              </div>
              <Button
                as="a"
                href={photo.url}
                download
                target="_blank"
                variant="flat"
                className="bg-white/10 text-white hover:bg-white/20"
                startContent={<Download size={16} />}
              >
                Download
              </Button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default function AlbumDetailPage() {
  const { album, photos } = useLoaderData<{
    album: SerializedAlbum;
    photos: SerializedPhoto[];
  }>();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const albumDate = new Date(album.date);
  const formattedDate = albumDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          as={Link}
          to="/gallery"
          variant="light"
          startContent={<ArrowLeft size={16} />}
          className="mb-2"
        >
          Back to Gallery
        </Button>

        {/* Header */}
        <Card className="shadow-sm">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {album.isFeatured && (
                    <Chip size="sm" color="warning" variant="flat">
                      Featured
                    </Chip>
                  )}
                  <Chip size="sm" variant="flat" startContent={<Camera size={12} />}>
                    {photos.length} photos
                  </Chip>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{album.title}</h1>
                {album.description && (
                  <p className="mt-2 text-gray-600">{album.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  {formattedDate}
                </div>
              </div>

              {/* Cover Image */}
              {album.coverImage && (
                <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={album.coverImage}
                    alt={album.title}
                    classNames={{
                      wrapper: "w-full h-full",
                      img: "w-full h-full object-cover",
                    }}
                    radius="none"
                  />
                </div>
              )}
            </div>

            {/* Related Event */}
            {album.event && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button
                  as={Link}
                  to={`/events/${album.event}`}
                  variant="flat"
                  color="primary"
                  size="sm"
                >
                  View Related Event
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group"
              >
                <img
                  src={photo.thumbnail || photo.url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="py-12 text-center">
              <ImageIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No photos in this album yet</p>
            </CardBody>
          </Card>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={photos}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </div>
    </MainLayout>
  );
}
