/**
 * Admin Policies Listing Page
 * Manage company policies
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
} from "@heroui/react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  FileText,
  FolderOpen,
} from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  useLoaderData,
  useSearchParams,
  Link,
  useNavigation,
} from "react-router";

// Type definitions for loader data
interface PolicyCategory {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

interface Policy {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  category: PolicyCategory | string;
  pdfUrl?: string;
  pdfFileName?: string;
  effectiveDate?: string;
  version?: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  views: number;
  createdBy: { _id: string; name: string } | string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PolicyStats {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

interface LoaderData {
  policies: Policy[];
  categories: PolicyCategory[];
  stats: PolicyStats;
  pagination: { page: number; totalPages: number; totalCount: number };
  currentStatus: string;
  currentCategory: string;
  searchQuery: string;
}

const ITEMS_PER_PAGE = 10;

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getPolicies, getPolicyCategories, getPolicyStats, deletePolicy, togglePolicyStatus, togglePolicyFeatured, serializePolicy, serializePolicyCategory } = await import("~/lib/services/policy.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "all";
  const category = url.searchParams.get("category") || "";
  const search = url.searchParams.get("search") || "";

  const options: {
    page: number;
    limit: number;
    status?: "draft" | "published" | "archived";
    category?: string;
    search?: string;
  } = {
    page,
    limit: ITEMS_PER_PAGE,
  };

  if (status !== "all") {
    options.status = status as "draft" | "published" | "archived";
  }

  if (category) {
    options.category = category;
  }

  if (search) {
    options.search = search;
  }

  const [{ policies, total }, categories, stats] = await Promise.all([
    getPolicies(options),
    getPolicyCategories(),
    getPolicyStats(),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return Response.json({
    policies: policies.map(serializePolicy),
    categories: categories.map(serializePolicyCategory),
    stats,
    pagination: { page, totalPages, totalCount: total },
    currentStatus: status,
    currentCategory: category,
    searchQuery: search,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { getPolicies, getPolicyCategories, getPolicyStats, deletePolicy, togglePolicyStatus, togglePolicyFeatured, serializePolicy, serializePolicyCategory } = await import("~/lib/services/policy.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  const sessionData = await getSessionData(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const policyId = formData.get("policyId") as string;

  if (intent === "delete") {
    await deletePolicy(policyId);
    await logActivity({
      userId: sessionData?.userId,
      action: "delete",
      resource: "policy",
      resourceId: policyId,
      details: {},
      request,
    });
    return Response.json({ success: true, message: "Policy deleted" });
  }

  if (intent === "toggle-status") {
    const newStatus = formData.get("newStatus") as
      | "draft"
      | "published"
      | "archived";
    await togglePolicyStatus(policyId, newStatus);
    await logActivity({
      userId: sessionData?.userId,
      action: "update",
      resource: "policy",
      resourceId: policyId,
      details: { status: newStatus },
      request,
    });
    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "toggle-featured") {
    await togglePolicyFeatured(policyId);
    await logActivity({
      userId: sessionData?.userId,
      action: "update",
      resource: "policy",
      resourceId: policyId,
      details: { action: "toggle-featured" },
      request,
    });
    return Response.json({ success: true, message: "Featured status updated" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminPoliciesListingPage() {
  const {
    policies,
    categories,
    stats,
    pagination,
    currentStatus,
    currentCategory,
    searchQuery,
  } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", status);
    params.delete("page");
    setSearchParams(params);
  };

  const handleCategoryFilter = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
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

  const formatDate = (dateString: string | null | undefined) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-sm text-gray-500">
            Create and manage company policies
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            as={Link}
            to="/admin/policies/categories"
            variant="flat"
            startContent={<FolderOpen size={18} />}
          >
            Categories
          </Button>
          <Button
            as={Link}
            to="/admin/policies/new"
            color="primary"
            startContent={<Plus size={18} />}
          >
            Add Policy
          </Button>
        </div>
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
            <p className="text-sm text-gray-500">Total Policies</p>
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
        <Card
          className={`cursor-pointer shadow-sm ${currentStatus === "archived" ? "ring-2 ring-primary-500" : ""}`}
          isPressable
          onPress={() => handleStatusFilter("archived")}
        >
          <CardBody className="p-4">
            <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
            <p className="text-sm text-gray-500">Archived</p>
          </CardBody>
        </Card>
      </div>

      {/* Category Chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip
            variant={!currentCategory ? "solid" : "flat"}
            color={!currentCategory ? "primary" : "default"}
            className="cursor-pointer"
            onClick={() => handleCategoryFilter("")}
          >
            All Categories
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat._id}
              variant={currentCategory === cat._id ? "solid" : "flat"}
              color={currentCategory === cat._id ? "primary" : "default"}
              className="cursor-pointer"
              onClick={() => handleCategoryFilter(cat._id)}
            >
              {cat.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Policies</h2>
          <Input
            placeholder="Search policies..."
            defaultValue={searchQuery}
            onValueChange={handleSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-xs"
          />
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <Table aria-label="Policies table" removeWrapper className="min-w-[700px]">
            <TableHeader>
              <TableColumn>POLICY</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>VERSION</TableColumn>
              <TableColumn>EFFECTIVE DATE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No policies found">
              {policies.map((policy) => (
                <TableRow key={policy._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                        <FileText size={20} className="text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-gray-900">
                            {policy.title}
                          </p>
                          {policy.isFeatured && (
                            <Star
                              size={14}
                              className="fill-yellow-400 text-yellow-400"
                            />
                          )}
                        </div>
                        <p className="truncate text-xs text-gray-500">
                          {policy.pdfUrl ? "PDF Document" : "Web Content"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {typeof policy.category === "object" && policy.category ? (
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${policy.category.color}20`,
                          color: policy.category.color,
                        }}
                      >
                        {policy.category.name}
                      </Chip>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={statusColors[policy.status]}
                      variant="flat"
                    >
                      {policy.status}
                    </Chip>
                  </TableCell>
                  <TableCell>{policy.version || "-"}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(policy.effectiveDate)}
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
                          href={`/policies/${policy.slug}`}
                          target="_blank"
                        >
                          View
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit size={16} />}
                          href={`/admin/policies/${policy._id}/edit`}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="toggle-status"
                          startContent={<Eye size={16} />}
                          onPress={() => {
                            const newStatus =
                              policy.status === "published" ? "draft" : "published";
                            const form = document.createElement("form");
                            form.method = "post";
                            form.innerHTML = `
                              <input type="hidden" name="intent" value="toggle-status" />
                              <input type="hidden" name="policyId" value="${policy._id}" />
                              <input type="hidden" name="newStatus" value="${newStatus}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {policy.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownItem>
                        <DropdownItem
                          key="toggle-featured"
                          startContent={<Star size={16} />}
                          onPress={() => {
                            const form = document.createElement("form");
                            form.method = "post";
                            form.innerHTML = `
                              <input type="hidden" name="intent" value="toggle-featured" />
                              <input type="hidden" name="policyId" value="${policy._id}" />
                            `;
                            document.body.appendChild(form);
                            form.submit();
                          }}
                        >
                          {policy.isFeatured ? "Remove Featured" : "Make Featured"}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          color="danger"
                          startContent={<Trash2 size={16} />}
                          onPress={() => {
                            if (
                              confirm("Are you sure you want to delete this policy?")
                            ) {
                              const form = document.createElement("form");
                              form.method = "post";
                              form.innerHTML = `
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="policyId" value="${policy._id}" />
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
