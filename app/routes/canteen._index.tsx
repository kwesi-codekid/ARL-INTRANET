/**
 * Public Canteen Menu Page
 * Task: 1.2.4.2.1 - Create canteen menu page
 * Task: 1.2.4.2.2 - Build daily menu view (breakfast, lunch, dinner)
 * Task: 1.2.4.2.3 - Build weekly menu calendar view
 * Task: 1.2.4.2.4 - Create daily/weekly toggle
 * Task: 1.2.4.2.5 - Add dietary indicator icons (vegetarian, halal, etc.)
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Chip,
  Divider,
  Button,
} from "@heroui/react";
import {
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Leaf,
  AlertCircle,
} from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { MainLayout } from "~/components/layout";
import { connectDB } from "~/lib/db/connection.server";
import {
  getTodayMenu,
  getWeekMenus,
  serializeMenu,
} from "~/lib/services/menu.server";
import {
  dietaryInfo,
  mealTimeInfo,
  type SerializedMenu,
  type SerializedMeal,
  type MealType,
  type DietaryType,
} from "~/lib/utils/menu-constants";

export async function loader({ request }: LoaderFunctionArgs) {
  await connectDB();

  const url = new URL(request.url);
  const weekOffset = parseInt(url.searchParams.get("week") || "0");

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const [todayMenu, weekMenus] = await Promise.all([
    getTodayMenu(),
    getWeekMenus(baseDate),
  ]);

  return Response.json({
    todayMenu: todayMenu ? serializeMenu(todayMenu) : null,
    weekMenus: weekMenus.map(serializeMenu),
    weekOffset,
  });
}

interface LoaderData {
  todayMenu: SerializedMenu | null;
  weekMenus: SerializedMenu[];
  weekOffset: number;
}

const mealIcons: Record<MealType, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const mealColors: Record<MealType, string> = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch: "bg-blue-100 text-blue-700",
  dinner: "bg-purple-100 text-purple-700",
  snack: "bg-green-100 text-green-700",
};

function DietaryBadge({ dietary }: { dietary: DietaryType }) {
  const info = dietaryInfo[dietary];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-100"
      title={info.label}
    >
      {info.icon}
    </span>
  );
}

function MealCard({ meal }: { meal: SerializedMeal }) {
  const Icon = mealIcons[meal.type];
  const colorClass = mealColors[meal.type];
  const timeInfo = mealTimeInfo[meal.type];

  const availableItems = meal.items.filter((item) => item.isAvailable);

  if (availableItems.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{timeInfo.label}</h3>
          <p className="text-xs text-gray-500">
            {meal.startTime || timeInfo.defaultStart} - {meal.endTime || timeInfo.defaultEnd}
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="pt-3">
        <ul className="space-y-3">
          {availableItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{item.name}</span>
                  {item.dietary.map((d) => (
                    <DietaryBadge key={d} dietary={d} />
                  ))}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function TodayView({ menu }: { menu: SerializedMenu | null }) {
  if (!menu) {
    return (
      <Card className="shadow-sm">
        <CardBody className="py-12 text-center">
          <UtensilsCrossed size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No Menu Available</h3>
          <p className="text-gray-500">Today's menu has not been published yet.</p>
        </CardBody>
      </Card>
    );
  }

  const mealOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const sortedMeals = [...menu.meals].sort(
    (a, b) => mealOrder.indexOf(a.type) - mealOrder.indexOf(b.type)
  );

  return (
    <div className="space-y-4">
      {/* Date Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar size={16} />
        <span>
          {new Date(menu.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Meals */}
      <div className="grid gap-4 md:grid-cols-2">
        {sortedMeals.map((meal, index) => (
          <MealCard key={index} meal={meal} />
        ))}
      </div>

      {/* Notes */}
      {menu.notes && (
        <Card className="shadow-sm bg-amber-50 border-amber-200 border">
          <CardBody className="flex flex-row items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Note</h4>
              <p className="text-sm text-amber-700">{menu.notes}</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function WeekView({
  menus,
  weekOffset,
  onWeekChange,
}: {
  menus: SerializedMenu[];
  weekOffset: number;
  onWeekChange: (offset: number) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate week days
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
  menus.forEach((menu) => {
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

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="light"
          startContent={<ChevronLeft size={18} />}
          onPress={() => onWeekChange(weekOffset - 1)}
        >
          Previous
        </Button>
        <span className="font-medium text-gray-900">{weekLabel}</span>
        <Button
          variant="light"
          endContent={<ChevronRight size={18} />}
          onPress={() => onWeekChange(weekOffset + 1)}
        >
          Next
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {weekDays.map((date, index) => {
          const menu = menuMap.get(date.toDateString());
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today;

          return (
            <Card
              key={index}
              className={`shadow-sm ${isToday ? "ring-2 ring-primary" : ""} ${
                isPast ? "opacity-60" : ""
              }`}
            >
              <CardHeader className={`pb-2 ${isToday ? "bg-primary-50" : ""}`}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-xs text-gray-500">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {isToday && (
                    <Chip size="sm" color="primary" variant="flat">
                      Today
                    </Chip>
                  )}
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="pt-2">
                {menu ? (
                  <div className="space-y-2">
                    {(["breakfast", "lunch", "dinner"] as MealType[]).map((mealType) => {
                      const meal = menu.meals.find((m) => m.type === mealType);
                      const availableItems = meal?.items.filter((i) => i.isAvailable) || [];
                      const Icon = mealIcons[mealType];

                      return (
                        <div key={mealType} className="flex items-start gap-2">
                          <Icon size={14} className="text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700">
                              {mealTimeInfo[mealType].label}
                            </p>
                            {availableItems.length > 0 ? (
                              <p className="text-xs text-gray-500 truncate">
                                {availableItems.map((i) => i.name).join(", ")}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Not available</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No menu</p>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function CanteenMenuPage() {
  const { todayMenu, weekMenus, weekOffset } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"daily" | "weekly">("daily");

  const handleWeekChange = (offset: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("week", offset.toString());
    setSearchParams(params);
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <UtensilsCrossed size={24} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Canteen Menu</h1>
            <p className="text-gray-500">See what's cooking in the canteen</p>
          </div>
        </div>
      </div>

      {/* Dietary Legend */}
      <Card className="mb-6 shadow-sm">
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Dietary:</span>
            {Object.entries(dietaryInfo).map(([key, info]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-sm text-gray-600"
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* View Toggle */}
      <Tabs
        selectedKey={view}
        onSelectionChange={(key) => setView(key as "daily" | "weekly")}
        variant="underlined"
        color="primary"
        className="mb-6"
      >
        <Tab key="daily" title="Today's Menu" />
        <Tab key="weekly" title="Weekly View" />
      </Tabs>

      {/* Content */}
      {view === "daily" ? (
        <TodayView menu={todayMenu} />
      ) : (
        <WeekView
          menus={weekMenus}
          weekOffset={weekOffset}
          onWeekChange={handleWeekChange}
        />
      )}
    </MainLayout>
  );
}
