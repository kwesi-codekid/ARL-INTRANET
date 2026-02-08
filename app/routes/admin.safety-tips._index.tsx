/**
 * Admin Safety Tips Listing Page
 * Task: 1.2.2.4.1 - Create admin safety tips listing
 */

import { useState } from "react";
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
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Shield,
  Star,
} from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link, Form, useSubmit } from "react-router";
import type { SerializedSafetyTip, SerializedSafetyCategory } from "~/lib/services/safety.server";

const ITEMS_PER_PAGE = 10;

interface LoaderData {
  tips: SerializedSafetyTip[];
  categories: SerializedSafetyCategory[];
  stats: {
    totalTips: number;
    publishedTips: number;
    totalVideos: number;
    publishedVideos: number;
    totalCategories: number;
    totalViews: number;
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  currentStatus: string;
  currentCategory: string;
  searchQuery: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyTips, getSafetyCategories, getSafetyStats, deleteSafetyTip, updateSafetyTip, serializeSafetyTip, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "all";
  const category = url.searchParams.get("category") || "";
  const search = url.searchParams.get("search") || "";

  const [result, categories, stats] = await Promise.all([
    getSafetyTips({
      status: status !== "all" ? (status as "draft" | "published" | "archived") : undefined,
      includeAll: status === "all",
      category: category || undefined,
      search: search || undefined,
      page,
      limit: ITEMS_PER_PAGE,
    }),
    getSafetyCategories(false),
    getSafetyStats(),
  ]);

  return Response.json({
    tips: result.tips.map(serializeSafetyTip),
    categories: categories.map(serializeSafetyCategory),
    stats,
    pagination: {
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
    },
    currentStatus: status,
    currentCategory: category,
    searchQuery: search,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getSafetyTips, getSafetyCategories, getSafetyStats, deleteSafetyTip, updateSafetyTip, serializeSafetyTip, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  if (intent === "delete" && id) {
    await deleteSafetyTip(id);
  } else if (intent === "toggle-status" && id) {
    const currentStatus = formData.get("currentStatus") as string;
    const newStatus = currentStatus === "published" ? "draft" : "published";
    await updateSafetyTip(id, { status: newStatus });
  } else if (intent === "toggle-featured" && id) {
    const isFeatured = formData.get("isFeatured") === "true";
    await updateSafetyTip(id, { isFeatured: !isFeatured });
  }

  return Response.json({ success: true });
}

export default function AdminSafetyTipsPage() {
  const { tips, categories, stats, pagination, currentStatus, currentCategory, searchQuery } =
    useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchQuery);
  const submit = useSubmit();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Safety Tips</h1>
          <p className="text-gray-500">Manage safety tips and guidelines</p>
        </div>
        <Button
          as={Link}
          to="/admin/safety-tips/new"
          color="success"
          startContent={<Plus size={18} />}
          className="w-full sm:w-auto"
        >
          Add Tip
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
              <Shield size={18} className="text-green-600 sm:hidden" />
              <Shield size={20} className="text-green-600 hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.totalTips}</p>
              <p className="text-xs text-gray-500 truncate">Total Tips</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
              <Eye size={18} className="text-blue-600 sm:hidden" />
              <Eye size={20} className="text-blue-600 hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.publishedTips}</p>
              <p className="text-xs text-gray-500 truncate">Published</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-purple-100 flex-shrink-0">
              <Star size={18} className="text-purple-600 sm:hidden" />
              <Star size={20} className="text-purple-600 hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.totalCategories}</p>
              <p className="text-xs text-gray-500 truncate">Categories</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-100 flex-shrink-0">
              <Eye size={18} className="text-orange-600 sm:hidden" />
              <Eye size={20} className="text-orange-600 hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-gray-500 truncate">Total Views</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="flex-1">
            <Input
              placeholder="Search tips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search size={18} className="text-gray-400" />}
              classNames={{ inputWrapper: "bg-gray-50" }}
            />
          </form>
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <Select
              placeholder="Status"
              selectedKeys={[currentStatus]}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full xs:flex-1 sm:w-40 sm:flex-none"
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="published">Published</SelectItem>
              <SelectItem key="draft">Draft</SelectItem>
              <SelectItem key="archived">Archived</SelectItem>
            </Select>
            <Select
              placeholder="Category"
              selectedKeys={currentCategory ? [currentCategory] : []}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full xs:flex-1 sm:w-48 sm:flex-none"
            >
              <SelectItem key="">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id}>{cat.name}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Safety tips table" removeWrapper className="min-w-[600px]">
            <TableHeader>
              <TableColumn>TITLE</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>VIEWS</TableColumn>
              <TableColumn>FEATURED</TableColumn>
              <TableColumn align="end">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No tips found">
              {tips.map((tip) => (
                <TableRow key={tip.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {tip.featuredImage ? (
                        <img
                          src={tip.featuredImage}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-green-100">
                          <Shield size={16} className="text-green-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{tip.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tip.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tip.category && (
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${tip.category.color}20`,
                          color: tip.category.color,
                        }}
                      >
                        {tip.category.name}
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={getStatusColor(tip.status)} variant="flat">
                      {tip.status}
                    </Chip>
                  </TableCell>
                  <TableCell>{tip.views}</TableCell>
                  <TableCell>
                    <Form method="post">
                      <input type="hidden" name="intent" value="toggle-featured" />
                      <input type="hidden" name="id" value={tip.id} />
                      <input type="hidden" name="isFeatured" value={String(tip.isFeatured)} />
                      <Button
                        type="submit"
                        isIconOnly
                        variant="light"
                        size="sm"
                        className={tip.isFeatured ? "text-yellow-500" : "text-gray-300"}
                      >
                        <Star size={18} fill={tip.isFeatured ? "currentColor" : "none"} />
                      </Button>
                    </Form>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        as={Link}
                        to={`/safety-tips/${tip.slug}`}
                        isIconOnly
                        variant="light"
                        size="sm"
                      >
                        <Eye size={18} />
                      </Button>
                      <Button
                        as={Link}
                        to={`/admin/safety-tips/${tip.id}/edit`}
                        isIconOnly
                        variant="light"
                        size="sm"
                      >
                        <Edit size={18} />
                      </Button>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="light" size="sm">
                            <MoreVertical size={18} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                          <DropdownItem
                            key="toggle"
                            onPress={() => {
                              const formData = new FormData();
                              formData.set("intent", "toggle-status");
                              formData.set("id", tip.id);
                              formData.set("currentStatus", tip.status);
                              submit(formData, { method: "post" });
                            }}
                          >
                            {tip.status === "published" ? "Unpublish" : "Publish"}
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            onPress={() => {
                              if (confirm("Are you sure you want to delete this tip?")) {
                                const formData = new FormData();
                                formData.set("intent", "delete");
                                formData.set("id", tip.id);
                                submit(formData, { method: "post" });
                              }
                            }}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
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
            onChange={(page) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", page.toString());
              setSearchParams(params);
            }}
            color="success"
          />
        </div>
      )}
    </div>
  );
}
