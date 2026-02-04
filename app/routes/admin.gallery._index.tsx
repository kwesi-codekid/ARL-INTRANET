/**
 * Admin Gallery Listing Page
 * Task: 1.3.1.2.4 - Admin gallery management
 */

import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Image,
} from "@heroui/react";
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Star, Camera, Images } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link } from "react-router";

const ITEMS_PER_PAGE = 10;

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Album, Photo } = await import("~/lib/db/models/gallery.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";

  // Build query
  const query: Record<string, unknown> = {};

  if (status !== "all") {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Get total count
  const totalCount = await Album.countDocuments(query);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get albums
  const albums = await Album.find(query)
    .populate("createdBy", "name")
    .populate("event", "title")
    .sort({ date: -1 })
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .lean();

  // Get stats
  const totalPhotos = await Photo.countDocuments();
  const stats = {
    total: await Album.countDocuments(),
    published: await Album.countDocuments({ status: "published" }),
    draft: await Album.countDocuments({ status: "draft" }),
    featured: await Album.countDocuments({ isFeatured: true }),
    totalPhotos,
  };

  return Response.json({
    albums: albums.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      slug: a.slug,
      coverImage: a.coverImage,
      date: a.date?.toISOString(),
      event: a.event ? { id: (a.event as any)._id.toString(), title: (a.event as any).title } : null,
      photoCount: a.photoCount,
      status: a.status,
      isFeatured: a.isFeatured,
      createdBy: a.createdBy,
      createdAt: a.createdAt?.toISOString(),
    })),
    stats,
    pagination: { page, totalPages, totalCount },
    currentStatus: status,
    searchQuery: search,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Album, Photo } = await import("~/lib/db/models/gallery.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const albumId = formData.get("albumId") as string;

  if (intent === "delete") {
    // Delete all photos in album first
    await Photo.deleteMany({ album: albumId });
    await Album.findByIdAndDelete(albumId);
    return Response.json({ success: true, message: "Album deleted" });
  }

  if (intent === "toggle-status") {
    const album = await Album.findById(albumId);
    if (album) {
      album.status = album.status === "published" ? "draft" : "published";
      await album.save();
    }
    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "toggle-featured") {
    const album = await Album.findById(albumId);
    if (album) {
      album.isFeatured = !album.isFeatured;
      await album.save();
    }
    return Response.json({ success: true, message: "Featured status updated" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminGalleryListingPage() {
  const { albums, stats, pagination, currentStatus, searchQuery } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusColors: Record<string, "success" | "warning" | "default"> = {
    published: "success",
    draft: "warning",
    archived: "default",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-sm text-gray-500">Create and manage photo albums</p>
        </div>
        <Button
          as={Link}
          to="/admin/gallery/new"
          color="primary"
          startContent={<Plus size={18} />}
        >
          Create Album
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "all" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("all")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Albums</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.totalPhotos}</p>
            <p className="text-sm text-gray-500">Total Photos</p>
          </CardBody>
        </Card>
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "published" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("published")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-gray-500">Published</p>
          </CardBody>
        </Card>
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "draft" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("draft")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            <p className="text-sm text-gray-500">Drafts</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-primary-600">{stats.featured}</p>
            <p className="text-sm text-gray-500">Featured</p>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Albums</h2>
          <Input
            placeholder="Search albums..."
            defaultValue={searchQuery}
            onValueChange={handleSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-xs"
          />
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="Albums table" removeWrapper>
            <TableHeader>
              <TableColumn>ALBUM</TableColumn>
              <TableColumn>PHOTOS</TableColumn>
              <TableColumn>EVENT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No albums found">
              {albums.map((album) => (
                <TableRow key={album.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={album.coverImage || "https://via.placeholder.com/80x60?text=No+Cover"}
                        alt={album.title}
                        className="h-12 w-16 rounded object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {album.title}
                        </p>
                      </div>
                      {album.isFeatured && (
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Camera size={14} className="text-gray-400" />
                      <span>{album.photoCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {album.event ? (
                      <Chip size="sm" variant="flat" color="primary">
                        {album.event.title}
                      </Chip>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={statusColors[album.status]} variant="flat">
                      {album.status}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(album.date)}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Actions">
                        <DropdownItem
                          key="view"
                          startContent={<Eye size={16} />}
                          href={`/gallery/${album.slug}`}
                          target="_blank"
                        >
                          View Album
                        </DropdownItem>
                        <DropdownItem
                          key="photos"
                          startContent={<Images size={16} />}
                          href={`/admin/gallery/${album.id}/photos`}
                        >
                          Manage Photos
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={16} />}
                          href={`/admin/gallery/${album.id}/edit`}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="toggle-status"
                          startContent={<Eye size={16} />}
                          onPress={() => {
                            const form = document.createElement("form");
                            form.method = "post";
                            form.innerHTML = `
                              <input type="hidden" name="intent" value="toggle-status" />
                              <input type="hidden" name="albumId" value="${album.id}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {album.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownItem>
                        <DropdownItem
                          key="toggle-featured"
                          startContent={<Star size={16} />}
                          onPress={() => {
                            const form = document.createElement("form");
                            form.method = "post";
                            form.innerHTML = `
                              <input type="hidden" name="intent" value="toggle-featured" />
                              <input type="hidden" name="albumId" value="${album.id}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {album.isFeatured ? "Remove Featured" : "Make Featured"}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          color="danger"
                          startContent={<Trash2 size={16} />}
                          onPress={() => {
                            if (confirm("Are you sure you want to delete this album and all its photos?")) {
                              const form = document.createElement("form");
                              form.method = "post";
                              form.innerHTML = `
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="albumId" value="${album.id}" />
                              `;
                              document.body.appendChild(form);
                              form.submit();
                            }
                          }}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}
    </div>
  );
}
