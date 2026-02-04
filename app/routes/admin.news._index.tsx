/**
 * Admin News Listing Page
 * Task: 1.1.3.4.1
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
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Pin, Star } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link, Form, useNavigation } from "react-router";




const ITEMS_PER_PAGE = 10;

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { News } = await import("~/lib/db/models/news.server");

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
      { content: { $regex: search, $options: "i" } },
    ];
  }

  // Get total count
  const totalCount = await News.countDocuments(query);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Get news
  const news = await News.find(query)
    .populate("category", "name color")
    .populate("author", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .lean();

  // Get stats
  const stats = {
    total: await News.countDocuments(),
    published: await News.countDocuments({ status: "published" }),
    draft: await News.countDocuments({ status: "draft" }),
    featured: await News.countDocuments({ isFeatured: true }),
  };

  return Response.json({
    news: news.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      slug: n.slug,
      featuredImage: n.featuredImage,
      category: n.category,
      author: n.author,
      status: n.status,
      isFeatured: n.isFeatured,
      isPinned: n.isPinned,
      views: n.views,
      publishedAt: n.publishedAt?.toISOString(),
      createdAt: n.createdAt?.toISOString(),
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
  const { News } = await import("~/lib/db/models/news.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const newsId = formData.get("newsId") as string;

  if (intent === "delete") {
    await News.findByIdAndDelete(newsId);
    return Response.json({ success: true, message: "Article deleted" });
  }

  if (intent === "toggle-status") {
    const article = await News.findById(newsId);
    if (article) {
      article.status = article.status === "published" ? "draft" : "published";
      if (article.status === "published" && !article.publishedAt) {
        article.publishedAt = new Date();
      }
      await article.save();
    }
    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "toggle-featured") {
    const article = await News.findById(newsId);
    if (article) {
      article.isFeatured = !article.isFeatured;
      await article.save();
    }
    return Response.json({ success: true, message: "Featured status updated" });
  }

  if (intent === "toggle-pinned") {
    const article = await News.findById(newsId);
    if (article) {
      article.isPinned = !article.isPinned;
      await article.save();
    }
    return Response.json({ success: true, message: "Pinned status updated" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminNewsListingPage() {
  const { news, stats, pagination, currentStatus, searchQuery } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
          <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
          <p className="text-sm text-gray-500">Create and manage news articles</p>
        </div>
        <Button
          as={Link}
          to="/admin/news/new"
          color="primary"
          startContent={<Plus size={18} />}
        >
          Add Article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "all" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("all")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Articles</p>
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
          <h2 className="text-lg font-semibold">Articles</h2>
          <Input
            placeholder="Search articles..."
            defaultValue={searchQuery}
            onValueChange={handleSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-xs"
          />
        </CardHeader>
        <CardBody className="p-0">
          <Table aria-label="News articles table" removeWrapper>
            <TableHeader>
              <TableColumn>ARTICLE</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>VIEWS</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No articles found">
              {news.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={article.featuredImage || "https://via.placeholder.com/80x60?text=No+Image"}
                        alt={article.title}
                        className="h-12 w-16 rounded object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {article.title}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          By {article.author?.name}
                        </p>
                      </div>
                      {article.isPinned && (
                        <Pin size={14} className="text-primary-500" />
                      )}
                      {article.isFeatured && (
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      style={{
                        backgroundColor: `${article.category?.color}20`,
                        color: article.category?.color,
                      }}
                    >
                      {article.category?.name}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={statusColors[article.status]} variant="flat">
                      {article.status}
                    </Chip>
                  </TableCell>
                  <TableCell>{article.views}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(article.publishedAt || article.createdAt)}
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
                          href={`/news/${article.slug}`}
                          target="_blank"
                        >
                          View
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={16} />}
                          href={`/admin/news/${article.id}/edit`}
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
                              <input type="hidden" name="newsId" value="${article.id}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {article.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownItem>
                        <DropdownItem
                          key="toggle-featured"
                          startContent={<Star size={16} />}
                          onPress={() => {
                            const form = document.createElement("form");
                            form.method = "post";
                            form.innerHTML = `
                              <input type="hidden" name="intent" value="toggle-featured" />
                              <input type="hidden" name="newsId" value="${article.id}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {article.isFeatured ? "Remove Featured" : "Make Featured"}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          color="danger"
                          startContent={<Trash2 size={16} />}
                          onPress={() => {
                            if (confirm("Are you sure you want to delete this article?")) {
                              const form = document.createElement("form");
                              form.method = "post";
                              form.innerHTML = `
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="newsId" value="${article.id}" />
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
