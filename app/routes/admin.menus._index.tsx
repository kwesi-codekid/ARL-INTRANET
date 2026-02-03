/**
 * Admin Menu Listing Page
 * Task: 1.2.4.3.1 - Create admin menu listing/calendar page
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
} from "@heroui/react";
import {
  Plus,
  Calendar,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  FileText,
} from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Link, useSearchParams, Form, useSubmit } from "react-router";
import { requireAuth } from "~/lib/services/session.server";
import { connectDB } from "~/lib/db/connection.server";
import {
  getWeekMenus,
  getMenuStats,
  deleteMenu,
  getMenuTemplates,
  serializeMenu,
  serializeMenuTemplate,
} from "~/lib/services/menu.server";
import {
  mealTimeInfo,
  type SerializedMenu,
  type SerializedMenuTemplate,
  type MealType,
} from "~/lib/utils/menu-constants";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const weekOffset = parseInt(url.searchParams.get("week") || "0");

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const [weekMenus, stats, templates] = await Promise.all([
    getWeekMenus(baseDate),
    getMenuStats(),
    getMenuTemplates(),
  ]);

  return Response.json({
    weekMenus: weekMenus.map(serializeMenu),
    stats,
    templates: templates.map(serializeMenuTemplate),
    weekOffset,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  if (intent === "delete" && id) {
    await deleteMenu(id);
  }

  return Response.json({ success: true });
}

interface LoaderData {
  weekMenus: SerializedMenu[];
  stats: {
    totalMenus: number;
    thisWeek: number;
    nextWeek: number;
    templates: number;
  };
  templates: SerializedMenuTemplate[];
  weekOffset: number;
}

export default function AdminMenusPage() {
  const { weekMenus, stats, templates, weekOffset } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate week start
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() + weekOffset * 7);
  const dayOfWeek = startOfWeek.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Create menu map by date
  const menuMap = new Map<string, SerializedMenu>();
  weekMenus.forEach((menu) => {
    const date = new Date(menu.date);
    date.setHours(0, 0, 0, 0);
    menuMap.set(date.toDateString(), menu);
  });

  const weekLabel = `${weekDays[0].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${weekDays[6].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const handleWeekChange = (offset: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("week", offset.toString());
    setSearchParams(params);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this menu?")) {
      const formData = new FormData();
      formData.set("intent", "delete");
      formData.set("id", id);
      submit(formData, { method: "post" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canteen Menus</h1>
          <p className="text-gray-500">Manage daily canteen menus</p>
        </div>
        <div className="flex gap-2">
          <Button
            as={Link}
            to="/admin/menus/templates"
            variant="flat"
            startContent={<FileText size={18} />}
          >
            Templates
          </Button>
          <Button
            as={Link}
            to="/admin/menus/new"
            color="primary"
            startContent={<Plus size={18} />}
          >
            Create Menu
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <UtensilsCrossed size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalMenus}</p>
              <p className="text-xs text-gray-500">Total Menus</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
              <p className="text-xs text-gray-500">This Week</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.nextWeek}</p>
              <p className="text-xs text-gray-500">Next Week</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <FileText size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.templates}</p>
              <p className="text-xs text-gray-500">Templates</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Week Navigation */}
      <Card className="shadow-sm">
        <CardBody className="flex items-center justify-between">
          <Button
            variant="light"
            startContent={<ChevronLeft size={18} />}
            onPress={() => handleWeekChange(weekOffset - 1)}
          >
            Previous Week
          </Button>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <span className="font-medium text-gray-900">{weekLabel}</span>
            {weekOffset === 0 && (
              <Chip size="sm" color="primary" variant="flat">
                Current Week
              </Chip>
            )}
          </div>
          <Button
            variant="light"
            endContent={<ChevronRight size={18} />}
            onPress={() => handleWeekChange(weekOffset + 1)}
          >
            Next Week
          </Button>
        </CardBody>
      </Card>

      {/* Calendar View */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {weekDays.map((date, index) => {
          const menu = menuMap.get(date.toDateString());
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today;

          return (
            <Card
              key={index}
              className={`shadow-sm ${isToday ? "ring-2 ring-primary" : ""} ${
                isPast && !menu ? "opacity-50" : ""
              }`}
            >
              <CardHeader className={`pb-2 ${isToday ? "bg-primary-50" : ""}`}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs text-gray-500">
                      {date.toLocaleDateString("en-US", { weekday: "long" })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {isToday && (
                    <Chip size="sm" color="primary" variant="solid">
                      Today
                    </Chip>
                  )}
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="pt-3">
                {menu ? (
                  <div className="space-y-3">
                    {/* Meal Summary */}
                    {(["breakfast", "lunch", "dinner"] as MealType[]).map((mealType) => {
                      const meal = menu.meals.find((m) => m.type === mealType);
                      const itemCount = meal?.items.filter((i) => i.isAvailable).length || 0;

                      return (
                        <div key={mealType} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{mealTimeInfo[mealType].label}</span>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={itemCount > 0 ? "success" : "default"}
                          >
                            {itemCount} items
                          </Chip>
                        </div>
                      );
                    })}

                    <Divider />

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        as={Link}
                        to={`/admin/menus/${menu.id}/edit`}
                        isIconOnly
                        variant="light"
                        size="sm"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        as={Link}
                        to={`/admin/menus/new?copy=${menu.id}`}
                        isIconOnly
                        variant="light"
                        size="sm"
                        title="Copy to new date"
                      >
                        <Copy size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        color="danger"
                        onPress={() => handleDelete(menu.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400 mb-3">No menu</p>
                    {!isPast && (
                      <Button
                        as={Link}
                        to={`/admin/menus/new?date=${date.toISOString().split("T")[0]}`}
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<Plus size={14} />}
                      >
                        Add Menu
                      </Button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Quick Templates */}
      {templates.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Quick Templates</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {templates.slice(0, 5).map((template) => (
                <Button
                  key={template.id}
                  as={Link}
                  to={`/admin/menus/new?template=${template.id}`}
                  variant="flat"
                  size="sm"
                >
                  {template.name}
                  {template.isDefault && (
                    <Chip size="sm" color="primary" variant="flat" className="ml-2">
                      Default
                    </Chip>
                  )}
                </Button>
              ))}
              <Button
                as={Link}
                to="/admin/menus/templates"
                variant="light"
                size="sm"
              >
                View All Templates
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
