/**
 * Admin Create Menu Page
 * Task: 1.2.4.3.2 - Build menu creation form
 * Task: 1.2.4.3.3 - Create meal/item builder interface
 * Task: 1.2.4.3.4 - Implement menu copy/duplicate functionality
 */

import { useState, useEffect } from "react";
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
import {
  dietaryInfo,
  mealTimeInfo,
  type SerializedMenu,
  type SerializedMenuTemplate,
  type MealType,
  type DietaryType,
  type IMeal,
  type IMenuItem,
} from "~/lib/utils/menu-constants";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { createMenu, getMenuTemplates, getMenuTemplateById, getMenuByDate, serializeMenu, serializeMenuTemplate } = await import("~/lib/services/menu.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Menu } = await import("~/lib/db/models/menu.server");

  await requireAuth(request);
  await connectDB();

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const copyId = url.searchParams.get("copy");
  const templateId = url.searchParams.get("template");

  let initialMenu: SerializedMenu | null = null;
  let initialDate = dateParam || new Date().toISOString().split("T")[0];

  // Copy from existing menu
  if (copyId) {
    const menu = await Menu.findById(copyId);
    if (menu) {
      initialMenu = serializeMenu(menu);
    }
  }

  // Load from template
  if (templateId) {
    const template = await getMenuTemplateById(templateId);
    if (template) {
      // Convert template to menu format
      initialMenu = {
        id: "",
        date: initialDate,
        meals: template.meals.map((m) => ({
          type: m.type,
          items: m.items.map((i) => ({
            name: i.name,
            description: i.description,
            dietary: i.dietary,
            isAvailable: i.isAvailable,
          })),
          startTime: m.startTime,
          endTime: m.endTime,
        })),
        isActive: true,
        createdAt: "",
        updatedAt: "",
      };
    }
  }

  const templates = await getMenuTemplates();

  return Response.json({
    initialMenu,
    initialDate,
    templates: templates.map(serializeMenuTemplate),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { createMenu, getMenuTemplates, getMenuTemplateById, getMenuByDate, serializeMenu, serializeMenuTemplate } = await import("~/lib/services/menu.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { Menu } = await import("~/lib/db/models/menu.server");

  const user = await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string;
  const mealsJson = formData.get("meals") as string;

  const meals = JSON.parse(mealsJson) as IMeal[];

  await createMenu({
    date: new Date(date),
    meals,
    notes: notes || undefined,
    createdBy: user._id.toString(),
  });

  return redirect("/admin/menus");
}

interface LoaderData {
  initialMenu: SerializedMenu | null;
  initialDate: string;
  templates: SerializedMenuTemplate[];
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

export default function AdminCreateMenuPage() {
  const { initialMenu, initialDate, templates } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [date, setDate] = useState(initialDate);
  const [notes, setNotes] = useState(initialMenu?.notes || "");
  const [meals, setMeals] = useState<IMeal[]>(
    initialMenu?.meals || []
  );

  const addMeal = (type: MealType) => {
    if (meals.some((m) => m.type === type)) {
      return; // Already exists
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

  const loadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMeals(template.meals);
    }
  };

  const availableMealTypes = (["breakfast", "lunch", "dinner", "snack"] as MealType[]).filter(
    (type) => !meals.some((m) => m.type === type)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button as={Link} to="/admin/menus" variant="light" isIconOnly>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Menu</h1>
          <p className="text-gray-500">Create a new daily canteen menu</p>
        </div>
      </div>

      <Form method="post">
        <input type="hidden" name="meals" value={JSON.stringify(meals)} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date & Notes */}
            <Card className="shadow-sm">
              <CardHeader>
                <h2 className="font-semibold">Menu Details</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  type="date"
                  label="Date"
                  name="date"
                  isRequired
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <Textarea
                  label="Notes (optional)"
                  name="notes"
                  placeholder="Any special notes or announcements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
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

              {meals.length === 0 ? (
                <Card className="shadow-sm">
                  <CardBody className="py-12 text-center">
                    <Coffee size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">No meals added yet</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {(["breakfast", "lunch", "dinner"] as MealType[]).map((type) => (
                        <Button
                          key={type}
                          variant="flat"
                          color="primary"
                          onPress={() => addMeal(type)}
                          startContent={
                            type === "breakfast" ? (
                              <Coffee size={16} />
                            ) : type === "lunch" ? (
                              <Sun size={16} />
                            ) : (
                              <Moon size={16} />
                            )
                          }
                        >
                          Add {mealTimeInfo[type].label}
                        </Button>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ) : (
                meals
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
                  ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Templates */}
            {templates.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <h2 className="font-semibold">Load Template</h2>
                </CardHeader>
                <CardBody className="space-y-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="flat"
                      fullWidth
                      className="justify-start"
                      onPress={() => loadTemplate(template.id)}
                    >
                      {template.name}
                      {template.isDefault && (
                        <Chip size="sm" color="primary" variant="flat" className="ml-auto">
                          Default
                        </Chip>
                      )}
                    </Button>
                  ))}
                </CardBody>
              </Card>
            )}

            {/* Submit */}
            <Card className="shadow-sm">
              <CardBody>
                <Button
                  type="submit"
                  color="primary"
                  fullWidth
                  startContent={<Save size={18} />}
                  isLoading={isSubmitting}
                  isDisabled={meals.length === 0}
                >
                  Create Menu
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {meals.length === 0
                    ? "Add at least one meal to create the menu"
                    : `${meals.length} meal(s) configured`}
                </p>
              </CardBody>
            </Card>

            {/* Tips */}
            <Card className="shadow-sm bg-blue-50 border-blue-200 border">
              <CardBody>
                <h3 className="font-semibold text-blue-800 mb-2">Tips</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Add dietary tags to help employees with restrictions</li>
                  <li>Use templates to quickly create recurring menus</li>
                  <li>Set accurate serving times for each meal</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
