/**
 * Admin App Links Management
 * Task: 1.1.5.3.1, 1.1.5.3.4 (drag-and-drop reordering)
 */

import React, { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Form, useNavigation, useActionData, Link, useFetcher } from "react-router";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Button,
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Textarea,
} from "@heroui/react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AppWindow,
  ExternalLink,
  Lock,
  Folder,
  BarChart,
  MousePointerClick,
  GripVertical,
  // Additional icons for display
  LayoutGrid,
  FileText,
  Mail,
  Calendar,
  Database,
  Users,
  Settings,
  Shield,
  Truck,
  Wrench,
  Globe,
  Briefcase,
  Building,
  Building2,
  Calculator,
  CreditCard,
  DollarSign,
  Landmark,
  Receipt,
  Scale,
  Wallet,
  Clock,
  ClipboardList,
  Target,
  HardDrive,
  Laptop,
  Monitor,
  Server,
  Smartphone,
  Wifi,
  Zap,
  Headphones,
  MessageSquare,
  Phone,
  Video,
  FileSpreadsheet,
  LineChart,
  Factory,
  Home,
  MapPin,
  Package,
  Printer,
  ShoppingCart,
  Warehouse,
  Fuel,
  HardHat,
  Pickaxe,
  Heart,
  // Health & Medical (Med Treatment)
  HeartPulse,
  Activity,
  Stethoscope,
  Pill,
  Syringe,
  Cross,
  CirclePlus,
  Ambulance,
  // Safety & HSE (HSE Suite)
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Siren,
  BadgeCheck,
  ClipboardCheck,
  FileCheck,
  FileWarning,
  // Additional utility
  Eye,
  Megaphone,
  Bell,
  BookOpen,
  GraduationCap,
  Layers,
  PieChart,
  TrendingUp,
} from "lucide-react";

// Icon mapping for lucide icons
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  AppWindow, Folder, LayoutGrid, FileText, Mail, Calendar, Database, Users, Settings,
  Shield, BarChart, Truck, Wrench, Globe, Briefcase, Building, Building2, Calculator,
  CreditCard, DollarSign, Landmark, Receipt, Scale, Wallet, Clock, ClipboardList, Target,
  HardDrive, Laptop, Monitor, Server, Smartphone, Wifi, Zap, Headphones, MessageSquare,
  Phone, Video, FileSpreadsheet, LineChart, Factory, Home, MapPin, Package, Printer,
  ShoppingCart, Warehouse, Fuel, HardHat, Pickaxe, Heart,
  // Health & Medical
  HeartPulse, Activity, Stethoscope, Pill, Syringe, Cross, CirclePlus, Ambulance,
  // Safety & HSE
  AlertTriangle, AlertCircle, ShieldCheck, ShieldAlert, Flame, Siren, BadgeCheck,
  ClipboardCheck, FileCheck, FileWarning,
  // Additional
  Eye, Megaphone, Bell, BookOpen, GraduationCap, Layers, PieChart, TrendingUp,
};




import type { IAppLink, IAppLinkCategory } from "~/lib/db/models/app-link.server";

// Type definitions for loader and action data
interface AppLinkStats {
  total: number;
  active: number;
  totalClicks: number;
}

interface LoaderData {
  appLinks: IAppLink[];
  total: number;
  page: number;
  totalPages: number;
  categories: IAppLinkCategory[];
  stats: AppLinkStats;
  filters: { search?: string; category?: string };
}

interface ActionData {
  success?: boolean;
  message?: string;
  error?: string;
}

// Available lucide icons for selection - grouped by category
const availableIcons = [
  // General
  "AppWindow", "Folder", "LayoutGrid", "FileText", "Mail", "Calendar",
  "Database", "Users", "Settings", "Shield", "BarChart", "Truck", "Wrench", "Globe",
  // Business & Finance
  "Briefcase", "Building", "Building2", "Calculator", "CreditCard", "DollarSign",
  "Landmark", "Receipt", "Scale", "Wallet",
  // Time & Productivity
  "Clock", "ClipboardList", "Target",
  // Technology & IT
  "HardDrive", "Laptop", "Monitor", "Server", "Smartphone", "Wifi", "Zap",
  // Communication
  "Headphones", "MessageSquare", "Phone", "Video",
  // Charts & Data
  "FileSpreadsheet", "LineChart",
  // Logistics & Operations
  "Factory", "Home", "MapPin", "Package", "Printer", "ShoppingCart", "Warehouse",
  // Mining & Industry specific
  "Fuel", "HardHat", "Pickaxe",
  // Health & Medical (Med Treatment app)
  "Heart", "HeartPulse", "Activity", "Stethoscope", "Pill", "Syringe", "Cross", "CirclePlus", "Ambulance",
  // Safety & HSE (HSE Suite app)
  "AlertTriangle", "AlertCircle", "ShieldCheck", "ShieldAlert", "Flame", "Siren", "BadgeCheck",
  "ClipboardCheck", "FileCheck", "FileWarning",
  // Additional utility
  "Eye", "Megaphone", "Bell", "BookOpen", "GraduationCap", "Layers", "PieChart", "TrendingUp",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { getAppLinks, getCategories, createAppLink, updateAppLink, deleteAppLink, getAppLinkStats, reorderAppLinks } = await import("~/lib/services/app-link.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const page = parseInt(url.searchParams.get("page") || "1");

  const [appLinksResult, categories, stats] = await Promise.all([
    getAppLinks({
      search: search || undefined,
      category: category || undefined,
      includeInactive: true,
      page,
      limit: 20,
    }),
    getCategories({ includeInactive: true }),
    getAppLinkStats(),
  ]);

  return Response.json({
    appLinks: JSON.parse(JSON.stringify(appLinksResult.appLinks)),
    total: appLinksResult.total,
    page: appLinksResult.page,
    totalPages: appLinksResult.totalPages,
    categories: JSON.parse(JSON.stringify(categories)),
    stats,
    filters: { search, category },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth, getSessionData } = await import("~/lib/services/session.server");
  const { logActivity } = await import("~/lib/services/activity-log.server");
  const { getAppLinks, getCategories, createAppLink, updateAppLink, deleteAppLink, getAppLinkStats, reorderAppLinks } = await import("~/lib/services/app-link.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const sessionData = await getSessionData(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Create App Link
  if (intent === "create") {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      url: formData.get("url") as string,
      icon: formData.get("icon") as string || undefined,
      iconType: (formData.get("iconType") as "url" | "lucide" | "emoji") || "lucide",
      category: formData.get("category") as string,
      isInternal: formData.get("isInternal") === "true",
      isActive: true,
      order: parseInt(formData.get("order") as string) || 0,
    };

    if (!data.name || !data.url || !data.category) {
      return Response.json({ error: "Name, URL, and Category are required" });
    }

    const appLink = await createAppLink(data);

    await logActivity({
      userId: sessionData?.userId,
      action: "create",
      resource: "applink",
      resourceId: appLink._id.toString(),
      details: { name: data.name },
      request,
    });

    return Response.json({ success: true, message: "App link created successfully" });
  }

  // Update App Link
  if (intent === "update") {
    const id = formData.get("id") as string;
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      url: formData.get("url") as string,
      icon: formData.get("icon") as string || undefined,
      iconType: (formData.get("iconType") as "url" | "lucide" | "emoji") || "lucide",
      category: formData.get("category") as string,
      isInternal: formData.get("isInternal") === "true",
      isActive: formData.get("isActive") === "true",
      order: parseInt(formData.get("order") as string) || 0,
    };

    await updateAppLink(id, data);

    await logActivity({
      userId: sessionData?.userId,
      action: "update",
      resource: "applink",
      resourceId: id,
      details: { name: data.name },
      request,
    });

    return Response.json({ success: true, message: "App link updated successfully" });
  }

  // Delete App Link
  if (intent === "delete") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;

    await deleteAppLink(id);

    await logActivity({
      userId: sessionData?.userId,
      action: "delete",
      resource: "applink",
      resourceId: id,
      details: { name },
      request,
    });

    return Response.json({ success: true, message: "App link deleted successfully" });
  }

  // Reorder App Links - Task: 1.1.5.3.4
  if (intent === "reorder") {
    const orderedIds = formData.get("orderedIds") as string;
    const ids = JSON.parse(orderedIds) as string[];

    await reorderAppLinks(ids);

    await logActivity({
      userId: sessionData?.userId,
      action: "update",
      resource: "applink",
      resourceId: "bulk",
      details: { action: "reorder", count: ids.length },
      request,
    });

    return Response.json({ success: true, message: "Order updated successfully" });
  }

  return Response.json({ error: "Invalid action" });
}

// Helper component to render app icons
function AppIcon({ icon, iconType, className }: { icon?: string; iconType: string; className?: string }) {
  if (!icon) {
    return <AppWindow size={20} className={className} />;
  }

  if (iconType === "emoji") {
    return <span className="text-xl">{icon}</span>;
  }

  if (iconType === "url") {
    return <img src={icon} alt="" className="h-5 w-5 object-contain" />;
  }

  // lucide icon
  const IconComponent = iconMap[icon] || AppWindow;
  return <IconComponent size={20} className={className} />;
}

export default function AdminApps() {
  const { appLinks: initialAppLinks, total, page, totalPages, categories, stats, filters } =
    useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";
  const reorderFetcher = useFetcher();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAppLink, setEditAppLink] = useState<IAppLink | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<IAppLink | null>(null);
  const [appLinks, setAppLinks] = useState<IAppLink[]>(initialAppLinks);

  // Update local state when loader data changes
  useEffect(() => {
    setAppLinks(initialAppLinks);
  }, [initialAppLinks]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(appLinks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAppLinks(items);

    // Save new order to server
    const orderedIds = items.map((item) => item._id.toString());
    reorderFetcher.submit(
      { intent: "reorder", orderedIds: JSON.stringify(orderedIds) },
      { method: "post" }
    );
  };

  // Check if reordering is allowed (no filters applied)
  const canReorder = !filters.search && !filters.category;

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

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-primary-100 p-3">
              <AppWindow className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Apps</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-success-100 p-3">
              <AppWindow className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Apps</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-secondary-100 p-3">
              <Folder className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-warning-100 p-3">
              <MousePointerClick className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Clicks</p>
              <p className="text-2xl font-bold">{stats.totalClicks}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Search apps..."
              startContent={<Search size={18} className="text-gray-400" />}
              defaultValue={filters.search}
              onValueChange={handleSearch}
              className="sm:max-w-xs"
              classNames={{ inputWrapper: "bg-gray-50" }}
            />

            <Select
              placeholder="All Categories"
              selectedKeys={filters.category ? [filters.category] : []}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="sm:max-w-xs"
              classNames={{ trigger: "bg-gray-50" }}
            >
              {categories.map((cat: IAppLinkCategory) => (
                <SelectItem key={cat._id.toString()} textValue={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              as={Link}
              to="/admin/apps/categories"
              variant="bordered"
              startContent={<Folder size={18} />}
            >
              Categories
            </Button>
            <Button
              color="primary"
              startContent={<Plus size={18} />}
              onPress={() => setIsCreateOpen(true)}
            >
              Add App
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Success/Error Messages */}
      {actionData?.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {actionData.message}
        </div>
      )}
      {actionData?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {actionData.error}
        </div>
      )}

      {/* Reorder hint */}
      {canReorder && appLinks.length > 1 && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          <GripVertical size={14} className="mr-1 inline" />
          Drag and drop rows to reorder app links. Order is saved automatically.
        </div>
      )}

      {/* App Links Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {canReorder && <th className="w-10 px-3 py-3"></th>}
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">URL</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Clicks</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <Droppable droppableId="appLinks" isDropDisabled={!canReorder}>
                {(provided) => (
                  <tbody
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="divide-y divide-gray-100"
                  >
                    {appLinks.length === 0 ? (
                      <tr>
                        <td colSpan={canReorder ? 7 : 6} className="px-3 py-8 text-center text-gray-500">
                          No app links found
                        </td>
                      </tr>
                    ) : (
                      appLinks.map((appLink: IAppLink, index: number) => (
                        <Draggable
                          key={appLink._id.toString()}
                          draggableId={appLink._id.toString()}
                          index={index}
                          isDragDisabled={!canReorder}
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${snapshot.isDragging ? "bg-primary-50" : "hover:bg-gray-50"}`}
                            >
                              {canReorder && (
                                <td className="px-3 py-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab p-1 text-gray-400 hover:text-gray-600"
                                  >
                                    <GripVertical size={16} />
                                  </div>
                                </td>
                              )}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                                    <AppIcon
                                      icon={appLink.icon}
                                      iconType={appLink.iconType}
                                      className="text-primary-600"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{appLink.name}</span>
                                      {appLink.isInternal ? (
                                        <Lock size={12} className="text-gray-400" />
                                      ) : (
                                        <ExternalLink size={12} className="text-gray-400" />
                                      )}
                                    </div>
                                    {appLink.description && (
                                      <span className="text-xs text-gray-500 line-clamp-1">
                                        {appLink.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <Chip size="sm" variant="flat">
                                  {(appLink.category as IAppLinkCategory)?.name || "-"}
                                </Chip>
                              </td>
                              <td className="px-3 py-3">
                                <a
                                  href={appLink.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary-600 hover:underline max-w-[200px] truncate block"
                                >
                                  {appLink.url}
                                </a>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1 text-sm">
                                  <BarChart size={14} className="text-gray-400" />
                                  {appLink.clicks}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <Chip
                                  size="sm"
                                  color={appLink.isActive ? "success" : "default"}
                                  variant="flat"
                                >
                                  {appLink.isActive ? "Active" : "Inactive"}
                                </Chip>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setEditAppLink(appLink)}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={() => setDeleteConfirm(appLink)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </table>
          </DragDropContext>
        </CardBody>

        {totalPages > 1 && (
          <div className="flex justify-center border-t p-4">
            <Pagination
              total={totalPages}
              page={page}
              onChange={handlePageChange}
              showControls
              color="primary"
            />
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="2xl">
        <ModalContent>
          <Form method="post" onSubmit={() => setIsCreateOpen(false)}>
            <ModalHeader>Add New App Link</ModalHeader>
            <ModalBody>
              <input type="hidden" name="intent" value="create" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="name"
                  label="Name"
                  placeholder="Enter app name"
                  isRequired
                />
                <Select
                  name="category"
                  label="Category"
                  placeholder="Select category"
                  isRequired
                >
                  {categories
                    .filter((c: IAppLinkCategory) => c.isActive)
                    .map((cat: IAppLinkCategory) => (
                      <SelectItem key={cat._id.toString()} textValue={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </Select>
                <Input
                  name="url"
                  type="url"
                  label="URL"
                  placeholder="https://..."
                  isRequired
                  className="sm:col-span-2"
                />
                <Textarea
                  name="description"
                  label="Description"
                  placeholder="Brief description of the app..."
                  maxLength={200}
                  className="sm:col-span-2"
                />
                <Select
                  name="iconType"
                  label="Icon Type"
                  defaultSelectedKeys={["lucide"]}
                >
                  <SelectItem key="lucide" textValue="Lucide Icon">Lucide Icon</SelectItem>
                  <SelectItem key="emoji" textValue="Emoji">Emoji</SelectItem>
                  <SelectItem key="url" textValue="Image URL">Image URL</SelectItem>
                </Select>
                <Select
                  name="icon"
                  label="Icon"
                  placeholder="Select icon"
                >
                  {availableIcons.map((iconName) => {
                    const IconComp = iconMap[iconName] || AppWindow;
                    return (
                      <SelectItem key={iconName} textValue={iconName}>
                        <div className="flex items-center gap-2">
                          <IconComp size={18} />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
                <Input
                  name="order"
                  type="number"
                  label="Display Order"
                  placeholder="0"
                  defaultValue="0"
                />
                <div className="flex items-center gap-2">
                  <Switch name="isInternal" value="true" />
                  <span className="text-sm">Internal Link (opens in same window)</span>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" color="primary" isLoading={isSubmitting}>
                Create App Link
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editAppLink} onClose={() => setEditAppLink(null)} size="2xl">
        <ModalContent>
          {editAppLink && (
            <Form method="post" onSubmit={() => setEditAppLink(null)}>
              <ModalHeader>Edit App Link</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="id" value={editAppLink._id.toString()} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="name"
                    label="Name"
                    defaultValue={editAppLink.name}
                    isRequired
                  />
                  <Select
                    name="category"
                    label="Category"
                    defaultSelectedKeys={[(editAppLink.category as IAppLinkCategory)?._id?.toString() || ""]}
                    isRequired
                  >
                    {categories
                      .filter((c: IAppLinkCategory) => c.isActive)
                      .map((cat: IAppLinkCategory) => (
                        <SelectItem key={cat._id.toString()} textValue={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </Select>
                  <Input
                    name="url"
                    type="url"
                    label="URL"
                    defaultValue={editAppLink.url}
                    isRequired
                    className="sm:col-span-2"
                  />
                  <Textarea
                    name="description"
                    label="Description"
                    defaultValue={editAppLink.description || ""}
                    maxLength={200}
                    className="sm:col-span-2"
                  />
                  <Select
                    name="iconType"
                    label="Icon Type"
                    defaultSelectedKeys={[editAppLink.iconType]}
                  >
                    <SelectItem key="lucide" textValue="Lucide Icon">Lucide Icon</SelectItem>
                    <SelectItem key="emoji" textValue="Emoji">Emoji</SelectItem>
                    <SelectItem key="url" textValue="Image URL">Image URL</SelectItem>
                  </Select>
                  <Select
                    name="icon"
                    label="Icon"
                    defaultSelectedKeys={editAppLink.icon ? [editAppLink.icon] : []}
                  >
                    {availableIcons.map((iconName) => {
                      const IconComp = iconMap[iconName] || AppWindow;
                      return (
                        <SelectItem key={iconName} textValue={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComp size={18} />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </Select>
                  <Input
                    name="order"
                    type="number"
                    label="Display Order"
                    defaultValue={editAppLink.order?.toString() || "0"}
                  />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        name="isInternal"
                        value="true"
                        defaultSelected={editAppLink.isInternal}
                      />
                      <span className="text-sm">Internal Link</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        name="isActive"
                        value="true"
                        defaultSelected={editAppLink.isActive}
                      />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setEditAppLink(null)}>
                  Cancel
                </Button>
                <Button type="submit" color="primary" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <ModalContent>
          {deleteConfirm && (
            <Form method="post" onSubmit={() => setDeleteConfirm(null)}>
              <ModalHeader>Delete App Link</ModalHeader>
              <ModalBody>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={deleteConfirm._id.toString()} />
                <input type="hidden" name="name" value={deleteConfirm.name} />
                <p>
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                  This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button type="submit" color="danger" isLoading={isSubmitting}>
                  Delete
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
