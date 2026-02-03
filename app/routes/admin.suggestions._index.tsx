/**
 * Admin Suggestions Management Page
 * Task: 1.3.2.3 - Admin Suggestion Management
 */

import { useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Select,
  SelectItem,
  Input,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, useSearchParams, Form, Link } from "react-router";

// Type definitions
interface SuggestionCategory {
  id: string;
  name: string;
  isActive: boolean;
}

interface Suggestion {
  id: string;
  content: string;
  category?: { name: string; slug: string };
  status: string;
  adminNotes?: string;
  reviewedBy?: { name: string };
  reviewedAt?: string;
  createdAt: string;
}

interface SuggestionStats {
  total: number;
  new: number;
  reviewed: number;
  inProgress: number;
  resolved: number;
  archived: number;
  thisWeek: number;
  thisMonth: number;
}

interface LoaderData {
  suggestions: Suggestion[];
  total: number;
  page: number;
  totalPages: number;
  stats: SuggestionStats;
  categories: SuggestionCategory[];
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getSuggestions, getSuggestionStats, getAllCategories } = await import(
    "~/lib/services/suggestion.server"
  );

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as any;
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");

  const [suggestionsResult, stats, categories] = await Promise.all([
    getSuggestions({ status, category, search, page, limit: 20 }),
    getSuggestionStats(),
    getAllCategories(),
  ]);

  return Response.json({
    suggestions: suggestionsResult.suggestions.map((s) => ({
      id: s._id.toString(),
      content: s.content,
      category: s.category ? {
        name: (s.category as any).name,
        slug: (s.category as any).slug,
      } : null,
      status: s.status,
      adminNotes: s.adminNotes,
      reviewedBy: s.reviewedBy ? {
        name: (s.reviewedBy as any).name,
      } : null,
      reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    })),
    total: suggestionsResult.total,
    page: suggestionsResult.page,
    totalPages: suggestionsResult.totalPages,
    stats,
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      isActive: c.isActive,
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { updateSuggestionStatus, addAdminNote, deleteSuggestion } = await import(
    "~/lib/services/suggestion.server"
  );

  const user = await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update-status") {
    const id = formData.get("id") as string;
    const status = formData.get("status") as any;
    const notes = formData.get("notes") as string;

    await updateSuggestionStatus(id, status, user._id.toString(), notes);
    return Response.json({ success: true, message: "Status updated" });
  }

  if (intent === "add-note") {
    const id = formData.get("id") as string;
    const notes = formData.get("notes") as string;

    await addAdminNote(id, notes, user._id.toString());
    return Response.json({ success: true, message: "Note added" });
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteSuggestion(id);
    return Response.json({ success: true, message: "Suggestion deleted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

const statusConfig = {
  new: { label: "New", color: "primary" as const, icon: AlertCircle },
  reviewed: { label: "Reviewed", color: "secondary" as const, icon: Eye },
  in_progress: { label: "In Progress", color: "warning" as const, icon: Clock },
  resolved: { label: "Resolved", color: "success" as const, icon: CheckCircle },
  archived: { label: "Archived", color: "default" as const, icon: Archive },
};

export default function AdminSuggestionsPage() {
  const { suggestions, total, page, totalPages, stats, categories } =
    useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const deleteFormRef = useRef<HTMLFormElement | null>(null);

  const currentStatus = searchParams.get("status") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const openSuggestionModal = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setNewStatus(suggestion.status);
    setAdminNotes(suggestion.adminNotes || "");
    onOpen();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suggestion Box</h1>
          <p className="text-sm text-gray-500">Manage anonymous suggestions</p>
        </div>
        <Link to="/admin/suggestions/categories">
          <Button variant="flat">Manage Categories</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="shadow-sm">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-primary-500">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-primary-600">{stats.new}</p>
            <p className="text-xs text-gray-500">New</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-warning-500">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-warning-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-success-500">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-success-600">{stats.resolved}</p>
            <p className="text-xs text-gray-500">Resolved</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
            <p className="text-xs text-gray-500">This Week</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            <p className="text-xs text-gray-500">This Month</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search suggestions..."
                value={currentSearch}
                onValueChange={(value) => handleFilterChange("search", value)}
                startContent={<Search size={16} className="text-gray-400" />}
                isClearable
                onClear={() => handleFilterChange("search", "")}
              />
            </div>
            <div className="w-40">
              <Select
                placeholder="Status"
                selectedKeys={currentStatus ? [currentStatus] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  handleFilterChange("status", value || "");
                }}
              >
                <SelectItem key="">All Statuses</SelectItem>
                <SelectItem key="new">New</SelectItem>
                <SelectItem key="reviewed">Reviewed</SelectItem>
                <SelectItem key="in_progress">In Progress</SelectItem>
                <SelectItem key="resolved">Resolved</SelectItem>
                <SelectItem key="archived">Archived</SelectItem>
              </Select>
            </div>
            <div className="w-40">
              <Select
                placeholder="Category"
                selectedKeys={currentCategory ? [currentCategory] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  handleFilterChange("category", value || "");
                }}
                items={[{ id: "", name: "All Categories" }, ...categories]}
              >
                {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Success Message */}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionData.message}
        </div>
      )}

      {/* Suggestions List */}
      <Card className="shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <h2 className="font-semibold">
            Suggestions ({total})
          </h2>
        </CardHeader>
        <CardBody>
          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const config = statusConfig[suggestion.status as keyof typeof statusConfig];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Chip
                            size="sm"
                            color={config.color}
                            variant="flat"
                            startContent={<StatusIcon size={12} />}
                          >
                            {config.label}
                          </Chip>
                          {suggestion.category && (
                            <Chip size="sm" variant="bordered">
                              {(suggestion.category as any).name}
                            </Chip>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDate(suggestion.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 line-clamp-3">{suggestion.content}</p>
                        {suggestion.adminNotes && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            Note: {suggestion.adminNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() => openSuggestionModal(suggestion)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No suggestions found</p>
              <p className="text-sm text-gray-400">
                {currentSearch || currentStatus || currentCategory
                  ? "Try adjusting your filters"
                  : "Suggestions will appear here when submitted"}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}

      {/* Detail/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {selectedSuggestion && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} />
                  <span>Suggestion Details</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {/* Meta info */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Submitted: {formatDate(selectedSuggestion.createdAt)}</span>
                    {selectedSuggestion.category && (
                      <>
                        <span>•</span>
                        <span>Category: {(selectedSuggestion.category as any).name}</span>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedSuggestion.content}
                    </p>
                  </div>

                  {/* Status Update */}
                  <Form method="post">
                    <input type="hidden" name="intent" value="update-status" />
                    <input type="hidden" name="id" value={selectedSuggestion.id} />

                    <div className="space-y-4">
                      <Select
                        label="Status"
                        name="status"
                        selectedKeys={[newStatus]}
                        onSelectionChange={(keys) => {
                          setNewStatus(Array.from(keys)[0] as string);
                        }}
                      >
                        <SelectItem key="new">New</SelectItem>
                        <SelectItem key="reviewed">Reviewed</SelectItem>
                        <SelectItem key="in_progress">In Progress</SelectItem>
                        <SelectItem key="resolved">Resolved</SelectItem>
                        <SelectItem key="archived">Archived</SelectItem>
                      </Select>

                      <Textarea
                        label="Admin Notes"
                        name="notes"
                        value={adminNotes}
                        onValueChange={setAdminNotes}
                        placeholder="Add internal notes about this suggestion..."
                        minRows={3}
                      />

                      <div className="flex justify-end gap-2">
                        <Button type="submit" color="primary" isLoading={isSubmitting}>
                          Update
                        </Button>
                      </div>
                    </div>
                  </Form>

                  {/* Delete */}
                  <div className="border-t pt-4">
                    <Form ref={deleteFormRef} method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={selectedSuggestion.id} />
                      <Button
                        type="button"
                        color="danger"
                        variant="flat"
                        size="sm"
                        startContent={<Trash2 size={14} />}
                        onPress={() => {
                          if (!confirm("Are you sure you want to delete this suggestion?")) return;
                          deleteFormRef.current?.requestSubmit();
                        }}
                      >
                        Delete Suggestion
                      </Button>
                    </Form>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
