/**
 * Gallery Service (Albums & Photos)
 * Task: 1.3.1.2 - Photo Gallery Backend
 */

import { Album, Photo, type IAlbum, type IPhoto } from "~/lib/db/models/gallery.server";
import { connectDB } from "~/lib/db/connection.server";

export interface CreateAlbumInput {
  title: string;
  description?: string;
  coverImage?: string;
  date: Date;
  event?: string;
  status?: "draft" | "published";
  isFeatured?: boolean;
  externalGalleryUrl?: string;
  isExternalGallery?: boolean;
  createdBy: string;
}

export interface UpdateAlbumInput extends Partial<CreateAlbumInput> {
  slug?: string;
}

export interface CreatePhotoInput {
  album: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  order?: number;
  width?: number;
  height?: number;
  fileSize?: number;
}

export interface AlbumFilters {
  status?: "draft" | "published";
  featured?: boolean;
  search?: string;
  event?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let finalSlug = slug;
  let counter = 1;

  while (true) {
    const query: { slug: string; _id?: { $ne: string } } = { slug: finalSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Album.findOne(query);
    if (!existing) break;

    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  return finalSlug;
}

// Album functions
export async function createAlbum(input: CreateAlbumInput): Promise<IAlbum> {
  await connectDB();

  const slug = await ensureUniqueSlug(generateSlug(input.title));

  const album = new Album({
    ...input,
    slug,
  });

  await album.save();
  return album;
}

export async function updateAlbum(
  id: string,
  input: UpdateAlbumInput
): Promise<IAlbum | null> {
  await connectDB();

  const updateData: UpdateAlbumInput = { ...input };

  if (input.title) {
    updateData.slug = await ensureUniqueSlug(generateSlug(input.title), id);
  }

  const album = await Album.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  return album;
}

export async function deleteAlbum(id: string): Promise<boolean> {
  await connectDB();

  // Delete all photos in the album first
  await Photo.deleteMany({ album: id });

  const result = await Album.findByIdAndDelete(id);
  return !!result;
}

export async function getAlbumById(id: string): Promise<IAlbum | null> {
  await connectDB();
  return Album.findById(id).populate("createdBy", "name").populate("event", "title slug");
}

export async function getAlbumBySlug(slug: string): Promise<IAlbum | null> {
  await connectDB();
  return Album.findOne({ slug, status: "published" })
    .populate("createdBy", "name")
    .populate("event", "title slug");
}

export async function getAlbums(
  filters: AlbumFilters = {},
  page = 1,
  limit = 12
): Promise<{ albums: IAlbum[]; total: number; pages: number }> {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.featured) {
    query.isFeatured = true;
  }

  if (filters.event) {
    query.event = filters.event;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const skip = (page - 1) * limit;

  const [albums, total] = await Promise.all([
    Album.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .populate("event", "title slug")
      .lean(),
    Album.countDocuments(query),
  ]);

  return {
    albums: albums as IAlbum[],
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getPublishedAlbums(limit?: number): Promise<IAlbum[]> {
  await connectDB();

  let query = Album.find({ status: "published" })
    .sort({ date: -1 })
    .populate("event", "title slug");

  if (limit) {
    query = query.limit(limit);
  }

  return query.lean() as Promise<IAlbum[]>;
}

export async function getFeaturedAlbums(limit = 4): Promise<IAlbum[]> {
  await connectDB();

  return Album.find({ status: "published", isFeatured: true })
    .sort({ date: -1 })
    .limit(limit)
    .lean() as Promise<IAlbum[]>;
}

export async function getAlbumsByEvent(eventId: string): Promise<IAlbum[]> {
  await connectDB();

  return Album.find({ event: eventId, status: "published" })
    .sort({ date: -1 })
    .lean() as Promise<IAlbum[]>;
}

export async function updateAlbumPhotoCount(albumId: string): Promise<void> {
  await connectDB();
  const count = await Photo.countDocuments({ album: albumId });
  await Album.findByIdAndUpdate(albumId, { photoCount: count });
}

export async function setAlbumCover(albumId: string, photoUrl: string): Promise<IAlbum | null> {
  await connectDB();
  return Album.findByIdAndUpdate(albumId, { coverImage: photoUrl }, { new: true });
}

// Photo functions
export async function addPhoto(input: CreatePhotoInput): Promise<IPhoto> {
  await connectDB();

  // Get the highest order in the album
  const lastPhoto = await Photo.findOne({ album: input.album }).sort({ order: -1 });
  const order = input.order ?? (lastPhoto ? lastPhoto.order + 1 : 0);

  const photo = new Photo({
    ...input,
    order,
  });

  await photo.save();

  // Update album photo count
  await updateAlbumPhotoCount(input.album);

  return photo;
}

export async function addPhotos(photos: CreatePhotoInput[]): Promise<IPhoto[]> {
  await connectDB();

  if (photos.length === 0) return [];

  const albumId = photos[0].album;

  // Get the highest order in the album
  const lastPhoto = await Photo.findOne({ album: albumId }).sort({ order: -1 });
  let order = lastPhoto ? lastPhoto.order + 1 : 0;

  const photoDocs = photos.map((photo) => ({
    ...photo,
    order: photo.order ?? order++,
  }));

  const insertedPhotos = await Photo.insertMany(photoDocs);

  // Update album photo count
  await updateAlbumPhotoCount(albumId);

  return insertedPhotos as unknown as IPhoto[];
}

export async function updatePhoto(
  id: string,
  input: Partial<CreatePhotoInput>
): Promise<IPhoto | null> {
  await connectDB();
  return Photo.findByIdAndUpdate(id, { $set: input }, { new: true });
}

export async function deletePhoto(id: string): Promise<boolean> {
  await connectDB();
  const photo = await Photo.findById(id);
  if (!photo) return false;

  const albumId = photo.album.toString();
  await Photo.findByIdAndDelete(id);

  // Update album photo count
  await updateAlbumPhotoCount(albumId);

  return true;
}

export async function deletePhotos(ids: string[]): Promise<number> {
  await connectDB();

  // Get album IDs for the photos
  const photos = await Photo.find({ _id: { $in: ids } });
  const albumIds = [...new Set(photos.map((p) => p.album.toString()))];

  const result = await Photo.deleteMany({ _id: { $in: ids } });

  // Update photo counts for affected albums
  for (const albumId of albumIds) {
    await updateAlbumPhotoCount(albumId);
  }

  return result.deletedCount;
}

export async function getPhotoById(id: string): Promise<IPhoto | null> {
  await connectDB();
  return Photo.findById(id);
}

export async function getPhotosByAlbum(
  albumId: string,
  page = 1,
  limit = 50
): Promise<{ photos: IPhoto[]; total: number; pages: number }> {
  await connectDB();

  const skip = (page - 1) * limit;

  const [photos, total] = await Promise.all([
    Photo.find({ album: albumId })
      .sort({ order: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Photo.countDocuments({ album: albumId }),
  ]);

  return {
    photos: photos as IPhoto[],
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getAllPhotosByAlbum(albumId: string): Promise<IPhoto[]> {
  await connectDB();
  return Photo.find({ album: albumId }).sort({ order: 1 }).lean() as Promise<IPhoto[]>;
}

export async function reorderPhotos(
  albumId: string,
  photoOrders: { id: string; order: number }[]
): Promise<void> {
  await connectDB();

  const bulkOps = photoOrders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, album: albumId },
      update: { $set: { order } },
    },
  }));

  await Photo.bulkWrite(bulkOps);
}

// Serialization helpers
export function serializeAlbum(album: IAlbum) {
  return {
    id: album._id.toString(),
    title: album.title,
    slug: album.slug,
    description: album.description,
    coverImage: album.coverImage,
    date: album.date.toISOString(),
    event: album.event ? {
      id: (album.event as unknown as { _id: { toString: () => string }; title: string; slug: string })._id?.toString() || album.event.toString(),
      title: (album.event as unknown as { title?: string }).title,
      slug: (album.event as unknown as { slug?: string }).slug,
    } : null,
    photoCount: album.photoCount,
    status: album.status,
    isFeatured: album.isFeatured,
    externalGalleryUrl: album.externalGalleryUrl,
    isExternalGallery: album.isExternalGallery,
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
  };
}

export function serializePhoto(photo: IPhoto) {
  return {
    id: photo._id.toString(),
    album: photo.album.toString(),
    url: photo.url,
    thumbnail: photo.thumbnail,
    caption: photo.caption,
    order: photo.order,
    width: photo.width,
    height: photo.height,
    fileSize: photo.fileSize,
    createdAt: photo.createdAt.toISOString(),
  };
}

export type SerializedAlbum = ReturnType<typeof serializeAlbum>;
export type SerializedPhoto = ReturnType<typeof serializePhoto>;
