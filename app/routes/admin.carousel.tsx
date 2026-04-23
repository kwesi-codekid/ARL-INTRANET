/**
 * Admin Carousel Management
 * Drag-and-drop reordering of homepage carousel items
 */

import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  useLoaderData,
  useFetcher,
} from "react-router";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Card,
  CardBody,
  Chip,
  Switch,
} from "@heroui/react";
import {
  GripVertical,
  Newspaper,
  Video,
  FileText,
  Lightbulb,
  Image,
} from "lucide-react";

interface CarouselListItem {
  id: string;
  title: string;
  type: "news" | "video" | "pdf" | "tip" | "company";
  carouselOrder: number;
  thumbnail?: string;
  showInSlideshow?: boolean;
  isFeatured?: boolean;
}

interface LoaderData {
  items: CarouselListItem[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");
  const { SafetyVideo } = await import(
    "~/lib/db/models/safety-video.server"
  );
  const { SafetyTip } = await import("~/lib/db/models/safety-tip.server");

  await requireAuth(request);
  await connectDB();

  // Fetch all items that are currently in the carousel or could be
  const [featuredNews, slideshowVideos, slideshowTips] = await Promise.all([
    News.find({
      status: "published",
      $or: [{ isFeatured: true }, { isPinned: true }],
      featuredImage: { $exists: true, $ne: "" },
    })
      .sort({ carouselOrder: -1, publishedAt: -1 })
      .select("title featuredImage isFeatured isPinned carouselOrder")
      .lean(),
    SafetyVideo.find({
      status: "published",
      showInSlideshow: true,
      videoUrl: { $exists: true, $ne: "" },
    })
      .sort({ carouselOrder: -1, createdAt: -1 })
      .select("title thumbnail showInSlideshow carouselOrder")
      .lean(),
    SafetyTip.find({
      status: "published",
      showInSlideshow: true,
      $or: [
        { featuredImage: { $exists: true, $ne: "" } },
        { documentUrl: { $exists: true, $ne: "" } },
      ],
    })
      .sort({ carouselOrder: -1, createdAt: -1 })
      .select(
        "title featuredImage documentUrl showInSlideshow carouselOrder"
      )
      .lean(),
  ]);

  const items: CarouselListItem[] = [
    ...featuredNews.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      type: "news" as const,
      carouselOrder: n.carouselOrder || 0,
      thumbnail: n.featuredImage || undefined,
      isFeatured: n.isFeatured,
    })),
    ...slideshowVideos.map((v) => ({
      id: v._id.toString(),
      title: v.title,
      type: "video" as const,
      carouselOrder: v.carouselOrder || 0,
      thumbnail: v.thumbnail || undefined,
      showInSlideshow: v.showInSlideshow,
    })),
    ...slideshowTips.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      type: t.documentUrl ? ("pdf" as const) : ("tip" as const),
      carouselOrder: t.carouselOrder || 0,
      thumbnail: t.featuredImage || undefined,
      showInSlideshow: t.showInSlideshow,
    })),
  ];

  // Sort: items with carouselOrder > 0 first (ascending), rest by original order
  items.sort((a, b) => {
    if (a.carouselOrder > 0 && b.carouselOrder > 0)
      return a.carouselOrder - b.carouselOrder;
    if (a.carouselOrder > 0) return -1;
    if (b.carouselOrder > 0) return 1;
    return 0;
  });

  return Response.json({ items });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");
  const { SafetyVideo } = await import(
    "~/lib/db/models/safety-video.server"
  );
  const { SafetyTip } = await import("~/lib/db/models/safety-tip.server");

  await requireAuth(request);
  await connectDB();

  const sessionData = await getSessionData(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "reorder") {
    const orderedData = JSON.parse(
      formData.get("orderedItems") as string
    ) as Array<{ id: string; type: string }>;

    // Build bulk operations per model
    const newsOps: { updateOne: { filter: { _id: string }; update: { $set: { carouselOrder: number } } } }[] = [];
    const videoOps: { updateOne: { filter: { _id: string }; update: { $set: { carouselOrder: number } } } }[] = [];
    const tipOps: { updateOne: { filter: { _id: string }; update: { $set: { carouselOrder: number } } } }[] = [];

    orderedData.forEach((item, index) => {
      const op = {
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { carouselOrder: index + 1 } },
        },
      };

      if (item.type === "news") newsOps.push(op);
      else if (item.type === "video") videoOps.push(op);
      else tipOps.push(op); // pdf and tip are both SafetyTip
    });

    await Promise.all([
      newsOps.length > 0 ? News.bulkWrite(newsOps) : Promise.resolve(),
      videoOps.length > 0
        ? SafetyVideo.bulkWrite(videoOps)
        : Promise.resolve(),
      tipOps.length > 0 ? SafetyTip.bulkWrite(tipOps) : Promise.resolve(),
    ]);

    await logActivity({
      userId: sessionData?.userId,
      action: "reorder",
      resource: "carousel",
      details: { count: orderedData.length },
      request,
    });

    return Response.json({
      success: true,
      message: "Carousel order updated",
    });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

const typeConfig = {
  news: { label: "News", color: "primary" as const, icon: Newspaper },
  video: { label: "Video", color: "success" as const, icon: Video },
  pdf: { label: "PDF", color: "warning" as const, icon: FileText },
  tip: { label: "Safety Tip", color: "secondary" as const, icon: Lightbulb },
  company: { label: "Company", color: "default" as const, icon: Image },
};

export default function AdminCarousel() {
  const { items: initialItems } = useLoaderData<LoaderData>();
  const [items, setItems] = useState(initialItems);
  const reorderFetcher = useFetcher();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setItems(reordered);

    // Save new order to server
    const orderedItems = reordered.map((item) => ({
      id: item.id,
      type: item.type,
    }));
    reorderFetcher.submit(
      {
        intent: "reorder",
        orderedItems: JSON.stringify(orderedItems),
      },
      { method: "post" }
    );
  };

  const isSaving = reorderFetcher.state !== "idle";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Carousel Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Drag and drop to arrange the order of items in the homepage carousel.
          The first item will be shown first.
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        <Chip size="sm" variant="flat">
          {items.length} items in carousel
        </Chip>
        {isSaving && (
          <Chip size="sm" color="warning" variant="flat">
            Saving order...
          </Chip>
        )}
        {reorderFetcher.data?.success && !isSaving && (
          <Chip size="sm" color="success" variant="flat">
            Order saved
          </Chip>
        )}
      </div>

      {/* Info */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardBody className="text-sm text-blue-700">
          <p>
            <strong>How it works:</strong> Items shown here are featured/pinned
            news, safety videos, safety tips, and PDFs that are marked for
            the homepage slideshow. To add or remove items, edit them from
            their respective admin pages and toggle the &quot;Show in
            Slideshow&quot; or &quot;Featured&quot; option.
          </p>
        </CardBody>
      </Card>

      {/* Drag-and-drop list */}
      {items.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-gray-500">
            No carousel items found. Mark news as featured or enable
            &quot;Show in Slideshow&quot; on safety videos/tips to add them
            here.
          </CardBody>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="carousel">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {items.map((item, index) => {
                  const config = typeConfig[item.type];
                  const Icon = config.icon;

                  return (
                    <Draggable
                      key={`${item.type}-${item.id}`}
                      draggableId={`${item.type}-${item.id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`rounded-lg border bg-white transition-shadow ${
                            snapshot.isDragging
                              ? "shadow-lg ring-2 ring-primary-300"
                              : "shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3 p-3">
                            {/* Drag handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                            >
                              <GripVertical size={20} />
                            </div>

                            {/* Position number */}
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                              {index + 1}
                            </div>

                            {/* Thumbnail */}
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt=""
                                className="h-12 w-16 flex-shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-16 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                                <Icon
                                  size={20}
                                  className="text-gray-400"
                                />
                              </div>
                            )}

                            {/* Title & type */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {item.title}
                              </p>
                              <Chip
                                size="sm"
                                color={config.color}
                                variant="flat"
                                className="mt-1"
                                startContent={
                                  <Icon size={12} />
                                }
                              >
                                {config.label}
                              </Chip>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
