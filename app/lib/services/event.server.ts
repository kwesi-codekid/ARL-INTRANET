/**
 * Event Service
 * Task: 1.3.1.1 - Events Backend
 */

import { Event, type IEvent } from "~/lib/db/models/event.server";
import { connectDB } from "~/lib/db/connection.server";
import type { Types } from "mongoose";

export interface CreateEventInput {
  title: string;
  description: string;
  content?: string;
  date: Date;
  endDate?: Date;
  time?: string;
  location: string;
  locationDetails?: string;
  featuredImage?: string;
  images?: string[];
  category?: string;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationRequired?: boolean;
  registrationLink?: string;
  maxAttendees?: number;
  status?: "draft" | "published" | "cancelled" | "completed";
  isFeatured?: boolean;
  createdBy: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  slug?: string;
}

export interface EventFilters {
  status?: "draft" | "published" | "cancelled" | "completed";
  upcoming?: boolean;
  past?: boolean;
  featured?: boolean;
  search?: string;
  category?: string;
  month?: number;
  year?: number;
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

    const existing = await Event.findOne(query);
    if (!existing) break;

    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  return finalSlug;
}

export async function createEvent(input: CreateEventInput): Promise<IEvent> {
  await connectDB();

  const slug = await ensureUniqueSlug(generateSlug(input.title));

  const event = new Event({
    ...input,
    slug,
    images: input.images || [],
  });

  await event.save();
  return event;
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput
): Promise<IEvent | null> {
  await connectDB();

  const updateData: UpdateEventInput = { ...input };

  // If title changed, regenerate slug
  if (input.title) {
    updateData.slug = await ensureUniqueSlug(generateSlug(input.title), id);
  }

  const event = await Event.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  return event;
}

export async function deleteEvent(id: string): Promise<boolean> {
  await connectDB();
  const result = await Event.findByIdAndDelete(id);
  return !!result;
}

export async function getEventById(id: string): Promise<IEvent | null> {
  await connectDB();
  return Event.findById(id).populate("createdBy", "name");
}

export async function getEventBySlug(slug: string): Promise<IEvent | null> {
  await connectDB();
  return Event.findOne({ slug, status: "published" }).populate("createdBy", "name");
}

export async function getEvents(
  filters: EventFilters = {},
  page = 1,
  limit = 10
): Promise<{ events: IEvent[]; total: number; pages: number }> {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.upcoming) {
    // Use start of today so events remain visible until the day ends
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    query.date = { $gte: startOfToday };
    query.status = "published";
  }

  if (filters.past) {
    // Past events are those before today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    query.date = { $lt: startOfToday };
    query.status = { $in: ["published", "completed"] };
  }

  if (filters.featured) {
    query.isFeatured = true;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.month !== undefined && filters.year !== undefined) {
    const startDate = new Date(filters.year, filters.month, 1);
    const endDate = new Date(filters.year, filters.month + 1, 0, 23, 59, 59);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(query)
      .sort({ date: filters.past ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
    Event.countDocuments(query),
  ]);

  return {
    events: events as IEvent[],
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function getTodayEvents(): Promise<IEvent[]> {
  await connectDB();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return Event.find({
    status: "published",
    date: { $gte: startOfToday, $lte: endOfToday },
  })
    .sort({ date: 1 })
    .lean() as Promise<IEvent[]>;
}

export async function getUpcomingEvents(limit = 5): Promise<IEvent[]> {
  await connectDB();

  // Use start of today so events remain visible until the day ends
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return Event.find({
    status: "published",
    date: { $gte: startOfToday },
  })
    .sort({ date: 1 })
    .limit(limit)
    .lean() as Promise<IEvent[]>;
}

export async function getPastEvents(limit = 10): Promise<IEvent[]> {
  await connectDB();

  // Past events are those before today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return Event.find({
    status: { $in: ["published", "completed"] },
    date: { $lt: startOfToday },
  })
    .sort({ date: -1 })
    .limit(limit)
    .lean() as Promise<IEvent[]>;
}

export async function getEventsByMonth(
  year: number,
  month: number
): Promise<IEvent[]> {
  await connectDB();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  return Event.find({
    status: "published",
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .lean() as Promise<IEvent[]>;
}

export async function toggleEventStatus(
  id: string,
  status: "draft" | "published" | "cancelled" | "completed"
): Promise<IEvent | null> {
  await connectDB();
  return Event.findByIdAndUpdate(id, { status }, { new: true });
}

export async function toggleEventFeatured(id: string): Promise<IEvent | null> {
  await connectDB();
  const event = await Event.findById(id);
  if (!event) return null;

  event.isFeatured = !event.isFeatured;
  await event.save();
  return event;
}

// Serialization helper for client
export function serializeEvent(event: IEvent) {
  return {
    id: event._id.toString(),
    title: event.title,
    slug: event.slug,
    description: event.description,
    content: event.content,
    date: event.date.toISOString(),
    endDate: event.endDate?.toISOString(),
    time: event.time,
    location: event.location,
    locationDetails: event.locationDetails,
    featuredImage: event.featuredImage,
    images: event.images,
    category: event.category,
    organizer: event.organizer,
    contactEmail: event.contactEmail,
    contactPhone: event.contactPhone,
    registrationRequired: event.registrationRequired,
    registrationLink: event.registrationLink,
    maxAttendees: event.maxAttendees,
    status: event.status,
    isFeatured: event.isFeatured,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export type SerializedEvent = ReturnType<typeof serializeEvent>;
