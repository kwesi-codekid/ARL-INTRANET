/**
 * Event Detail Page
 * Task: 1.3.1.3.3 - Create event detail page
 */

import {
  Card,
  CardBody,
  Button,
  Chip,
  Divider,
} from "@heroui/react";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Users,
  Mail,
  Phone,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";

export async function loader({ params }: LoaderFunctionArgs) {
  const { getEventBySlug, serializeEvent } = await import("~/lib/services/event.server");
  const { getAlbumsByEvent, serializeAlbum } = await import("~/lib/services/gallery.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const event = await getEventBySlug(params.slug!);

  if (!event) {
    throw new Response("Event not found", { status: 404 });
  }

  // Get related albums
  const albums = await getAlbumsByEvent(event._id.toString());

  return Response.json({
    event: serializeEvent(event),
    albums: albums.map(serializeAlbum),
  });
}

export default function EventDetailPage() {
  const { event, albums } = useLoaderData<typeof loader>();
  const { portalUser } = useOutletContext<PublicOutletContext>();

  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <MainLayout user={portalUser}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          as={Link}
          to="/events"
          variant="light"
          startContent={<ArrowLeft size={16} />}
          className="mb-2"
        >
          Back to Events
        </Button>

        {/* Hero Section */}
        {event.featuredImage ? (
          <div className="relative h-72 sm:h-96 rounded-xl overflow-hidden">
            <img
              src={event.featuredImage}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                {event.isFeatured && (
                  <Chip size="sm" color="warning" variant="solid">
                    Featured
                  </Chip>
                )}
                {event.category && (
                  <Chip size="sm" variant="solid" className="bg-white/20 text-white">
                    {event.category}
                  </Chip>
                )}
                {isPast && (
                  <Chip size="sm" color="default" variant="solid">
                    Past Event
                  </Chip>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {event.title}
              </h1>
            </div>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="p-6">
              <div className="flex items-center gap-2 mb-2">
                {event.isFeatured && (
                  <Chip size="sm" color="warning" variant="flat">
                    Featured
                  </Chip>
                )}
                {event.category && (
                  <Chip size="sm" variant="flat">
                    {event.category}
                  </Chip>
                )}
                {isPast && (
                  <Chip size="sm" color="default" variant="flat">
                    Past Event
                  </Chip>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {event.title}
              </h1>
            </CardBody>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About This Event</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-base">
                  {event.description}
                </p>

                {event.content && (
                  <div
                    className="mt-4 prose prose-base max-w-none text-gray-600 prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-800"
                    dangerouslySetInnerHTML={{ __html: event.content }}
                  />
                )}
              </CardBody>
            </Card>

            {/* Event Images */}
            {event.images && event.images.length > 0 && (
              <Card className="shadow-sm">
                <CardBody className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Images</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {event.images.map((image, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image}
                          alt={`${event.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Related Albums */}
            {albums.length > 0 && (
              <Card className="shadow-sm">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Photo Albums</h2>
                    <Button
                      as={Link}
                      to="/gallery"
                      size="sm"
                      variant="light"
                      color="primary"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {albums.map((album) => {
                      const isExternal = album.isExternalGallery && album.externalGalleryUrl;
                      const Wrapper = isExternal ? "a" : Link;
                      const linkProps = isExternal
                        ? { href: album.externalGalleryUrl!, target: "_blank", rel: "noopener noreferrer" }
                        : { to: `/gallery/${album.slug}` };

                      return (
                        <Wrapper
                          key={album.id}
                          {...linkProps as any}
                          className="group"
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            {album.coverImage ? (
                              <img
                                src={album.coverImage}
                                alt={album.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={32} className="text-gray-300" />
                              </div>
                            )}
                            {isExternal && (
                              <div className="absolute top-2 right-2">
                                <ExternalLink size={16} className="text-white drop-shadow-md" />
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-medium text-gray-900 group-hover:text-primary-600">
                            {album.title}
                          </p>
                          <p className="text-xs text-gray-500">{album.photoCount} photos</p>
                        </Wrapper>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card className="shadow-sm">
              <CardBody className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                      <Calendar size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{formattedDate}</p>
                      {event.endDate && (
                        <p className="text-sm text-gray-600">
                          to {new Date(event.endDate).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {event.time && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <Clock size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">{event.time}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                      <MapPin size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{event.location}</p>
                      {event.locationDetails && (
                        <p className="text-sm text-gray-600">{event.locationDetails}</p>
                      )}
                    </div>
                  </div>

                  {event.organizer && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                        <Users size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Organizer</p>
                        <p className="font-medium text-gray-900">{event.organizer}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Divider />

                {/* Contact Info */}
                {(event.contactEmail || event.contactPhone) && (
                  <>
                    <h3 className="font-medium text-gray-900">Contact</h3>
                    <div className="space-y-2">
                      {event.contactEmail && (
                        <a
                          href={`mailto:${event.contactEmail}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
                        >
                          <Mail size={14} />
                          {event.contactEmail}
                        </a>
                      )}
                      {event.contactPhone && (
                        <a
                          href={`tel:${event.contactPhone}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
                        >
                          <Phone size={14} />
                          {event.contactPhone}
                        </a>
                      )}
                    </div>
                    <Divider />
                  </>
                )}

                {/* Registration Button */}
                {!isPast && event.registrationRequired && event.registrationLink && (
                  <Button
                    as="a"
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    fullWidth
                    endContent={<ExternalLink size={16} />}
                  >
                    Register for Event
                  </Button>
                )}

                {isPast && (
                  <div className="text-center py-2">
                    <Chip color="default" variant="flat">
                      This event has ended
                    </Chip>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
