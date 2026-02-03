/**
 * Admin Edit Menu Page
 * Task: 1.2.4.3.2 - Build menu creation form
 * Task: 1.2.4.3.3 - Create meal/item builder interface
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Divider,
  Checkbox,
} from "@heroui/react";
import { ArrowLeft, Save, Plus, Trash2, Coffee, Sun, Moon, Cookie } from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useLoaderData, useNavigation } from "react-router";
import { requireAuth } from "~/lib/services/session.server";
import { connectDB } from "~/lib/db/connection.server";
import {
  updateMenu,
  serializeMenu,
} from "~/lib/services/menu.server";
import {
  dietaryInfo,
  mealTimeInfo,
  type SerializedMenu,
  type MealType,
  type DietaryType,
  type IMeal,
  type IMenuItem,
} from "~/lib/utils/menu-constants";
import { Menu } from "~/lib/db/models/menu.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAuth(request);
  await connectDB();

  const { id } = params;
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const menu = await Menu.findById(id).populate("createdBy", "name");
  if (!menu) {
    throw new Response("Not Found", { status: 404 });
  }

  return Response.json({
    menu: serializeMenu(menu),
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireAuth(request);
  await connectDB();

  const { id } = params;
  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const notes = formData.get("notes") as string;
  const mealsJson = formData.get("meals") as string;
  const isActive = formData.get("isActive") === "true";

  const meals = JSON.parse(mealsJson) as IMeal[];

  await updateMenu(id, {
    meals,
    notes: notes || undefined,
    isActive,
  });

  return redirect("/admin/menus");
}

interface LoaderData {
  menu: SerializedMenu;
}

const mealIcons: Record<MealType, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const dietaryOptions = Object.entries(dietaryInfo).map(([key, info]) => ({
  value: key as DietaryType,
  label: `${info.icon} ${info.label}`,
}));

function MealBuilder({
  meal,
  onChange,
  onRemove,
}: {
  meal: IMeal;
  onChange: (meal: IMeal) => void;
  onRemove: () => void;
}) {
  const Icon = mealIcons[meal.type];
  const timeInfo = mealTimeInfo[meal.type];

  const addItem = () => {
    onChange({
      ...meal,
      items: [...meal.items, { name: "", dietary: [], isAvailable: true }],
    });
  };

  const updateItem = (index: number, updates: Partial<IMenuItem>) => {
    const newItems = [...meal.items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ ...meal, items: newItems });
  };

  const removeItem = (index: number) => {
    onChange({
      ...meal,
      items: meal.items.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-primary" />
          <h3 className="font-semibold">{timeInfo.label}</h3>
        </div>
        <Button
          isIconOnly
          variant="light"
          color="danger"
          size="sm"
          onPress={onRemove}
        >
          <Trash2 size={16} />
        </Button>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        {/* Time Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="time"
            label="Start Time"
            value={meal.startTime || timeInfo.defaultStart}
            onChange={(e) => onChange({ ...meal, startTime: e.target.value })}
          />
          <Input
            type="time"
            label="End Time"
            value={meal.endTime || timeInfo.defaultEnd}
            onChange={(e) => onChange({ ...meal, endTime: e.target.value })}
          />
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Menu Items</span>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Plus size={14} />}
              onPress={addItem}
            >
              Add Item
            </Button>
          </div>

          {meal.items.map((item, index) => (
            <Card key={index} className="shadow-none border">
              <CardBody className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    label="Item Name"
                    placeholder="e.g., Jollof Rice"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    className="flex-1"
                    isRequired
                  />
                  <Button
                    isIconOnly
                    variant="light"
                    color="danger"
                    onPress={() => removeItem(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <Input
                  label="Description (optional)"
                  placeholder="Brief description of the dish"
                  value={item.description || ""}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                />

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 w-full">Dietary Options:</span>
                  {dietaryOptions.map((option) => (
                    <Chip
                      key={option.value}
                      variant={item.dietary.includes(option.value) ? "solid" : "bordered"}
                      color={item.dietary.includes(option.value) ? "primary" : "default"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newDietary = item.dietary.includes(option.value)
                          ? item.dietary.filter((d) => d !== option.value)
                          : [...item.dietary, option.value];
                        updateItem(index, { dietary: newDietary });
                      }}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>

                <Checkbox
                  isSelected={item.isAvailable}
                  onValueChange={(checked) => updateItem(index, { isAvailable: checked })}
                >
                  Available
                </Checkbox>
              </CardBody>
            </Card>
          ))}

          {meal.items.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No items added yet. Click "Add Item" to start.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function AdminEditMenuPage() {
  const { menu } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [notes, setNotes] = useState(menu.notes || "");
  const [isActive, setIsActive] = useState(menu.isActive);
  const [meals, setMeals] = useState<IMeal[]>(menu.meals);

  const addMeal = (type: MealType) => {
    if (meals.some((m) => m.type === type)) {
      return;
    }
    setMeals([
      ...meals,
      {
        type,
        items: [],
        startTime: mealTimeInfo[type].defaultStart,
        endTime: mealTimeInfo[type].defaultEnd,
      },
    ]);
  };

  const updateMeal = (index: number, meal: IMeal) => {
    const newMeals = [...meals];
    newMeals[index] = meal;
    setMeals(newMeals);
  };

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const availableMealTypes = (["breakfast", "lunch", "dinner", "snack"] as MealType[]).filter(
    (type) => !meals.some((m) => m.type === type)
  );

  const menuDate = new Date(menu.date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button as={Link} to="/admin/menus" variant="light" isIconOnly>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Menu</h1>
          <p className="text-gray-500">
            {menuDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <Form method="post">
        <input type="hidden" name="meals" value={JSON.stringify(meals)} />
        <input type="hidden" name="isActive" value={String(isActive)} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notes */}
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Menu Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Textarea
                  label="Notes (optional)"
                  name="notes"
                  placeholder="Any special notes or announcements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Checkbox isSelected={isActive} onValueChange={setIsActive}>
                  Menu is active and visible to employees
                </Checkbox>
              </CardBody>
            </Card>

            {/* Meals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Meals</h2>
                {availableMealTypes.length > 0 && (
                  <Select
                    placeholder="Add meal"
                    className="w-40"
                    onChange={(e) => addMeal(e.target.value as MealType)}
                    selectedKeys={[]}
                  >
                    {availableMealTypes.map((type) => (
                      <SelectItem key={type}>
                        {mealTimeInfo[type].label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>

              {meals
                .sort((a, b) => {
                  const order: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
                  return order.indexOf(a.type) - order.indexOf(b.type);
                })
                .map((meal, index) => (
                  <MealBuilder
                    key={meal.type}
                    meal={meal}
                    onChange={(updated) => updateMeal(index, updated)}
                    onRemove={() => removeMeal(index)}
                  />
                ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submit */}
            <Card className="shadow-sm">
              <CardBody>
                <Button
                  type="submit"
                  color="primary"
                  fullWidth
                  startContent={<Save size={18} />}
                  isLoading={isSubmitting}
                >
                  Save Changes
                </Button>
              </CardBody>
            </Card>

            {/* Menu Info */}
            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="font-semibold">Menu Info</h3>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span>{new Date(menu.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span>{new Date(menu.updatedAt).toLocaleDateString()}</span>
                </div>
                {menu.createdBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">By</span>
                    <span>{menu.createdBy.name}</span>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
