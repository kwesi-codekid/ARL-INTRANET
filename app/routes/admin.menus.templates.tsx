/**
 * Admin Menu Templates Page
 * Task: 1.2.4.3.6 - Add menu template management
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Star,
  Coffee,
  Sun,
  Moon,
  Cookie,
  FileText,
  Save,
} from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, Form, useSubmit, useNavigation } from "react-router";
import {
  dietaryInfo,
  mealTimeInfo,
  type SerializedMenuTemplate,
  type MealType,
  type DietaryType,
  type IMeal,
  type IMenuItem,
} from "~/lib/utils/menu-constants";

export async function loader({ request }: LoaderFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getMenuTemplates, createMenuTemplate, updateMenuTemplate, deleteMenuTemplate, serializeMenuTemplate } = await import("~/lib/services/menu.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await requireAuth(request);
  await connectDB();

  const templates = await getMenuTemplates();

  return Response.json({
    templates: templates.map(serializeMenuTemplate),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { getMenuTemplates, createMenuTemplate, updateMenuTemplate, deleteMenuTemplate, serializeMenuTemplate } = await import("~/lib/services/menu.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  const user = await requireAuth(request);
  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const mealsJson = formData.get("meals") as string;
    const isDefault = formData.get("isDefault") === "true";

    await createMenuTemplate({
      name,
      description: description || undefined,
      meals: JSON.parse(mealsJson),
      isDefault,
      createdBy: user._id.toString(),
    });
  } else if (intent === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const mealsJson = formData.get("meals") as string;
    const isDefault = formData.get("isDefault") === "true";

    await updateMenuTemplate(id, {
      name,
      description: description || undefined,
      meals: JSON.parse(mealsJson),
      isDefault,
    });
  } else if (intent === "delete") {
    const id = formData.get("id") as string;
    await deleteMenuTemplate(id);
  } else if (intent === "set-default") {
    const id = formData.get("id") as string;
    await updateMenuTemplate(id, { isDefault: true });
  }

  return Response.json({ success: true });
}

interface LoaderData {
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

function TemplateEditor({
  template,
  onClose,
}: {
  template?: SerializedMenuTemplate;
  onClose: () => void;
}) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [isDefault, setIsDefault] = useState(template?.isDefault || false);
  const [meals, setMeals] = useState<IMeal[]>(template?.meals || []);

  const addMeal = (type: MealType) => {
    if (meals.some((m) => m.type === type)) return;
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

  const handleSubmit = () => {
    const formData = new FormData();
    formData.set("intent", template ? "update" : "create");
    if (template) {
      formData.set("id", template.id);
    }
    formData.set("name", name);
    formData.set("description", description);
    formData.set("meals", JSON.stringify(meals));
    formData.set("isDefault", String(isDefault));
    submit(formData, { method: "post" });
    onClose();
  };

  const availableMealTypes = (["breakfast", "lunch", "dinner", "snack"] as MealType[]).filter(
    (type) => !meals.some((m) => m.type === type)
  );

  return (
    <div className="space-y-4">
      <Input
        label="Template Name"
        placeholder="e.g., Standard Weekday Menu"
        value={name}
        onChange={(e) => setName(e.target.value)}
        isRequired
      />

      <Textarea
        label="Description (optional)"
        placeholder="Brief description of this template..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Checkbox isSelected={isDefault} onValueChange={setIsDefault}>
        Set as default template
      </Checkbox>

      <Divider />

      {/* Meals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Meals</span>
          {availableMealTypes.length > 0 && (
            <Select
              placeholder="Add meal"
              className="w-40"
              size="sm"
              onChange={(e) => addMeal(e.target.value as MealType)}
              selectedKeys={[]}
            >
              {availableMealTypes.map((type) => (
                <SelectItem key={type}>{mealTimeInfo[type].label}</SelectItem>
              ))}
            </Select>
          )}
        </div>

        {meals.map((meal, mealIndex) => {
          const Icon = mealIcons[meal.type];

          return (
            <Card key={meal.type} className="shadow-none border">
              <CardHeader className="py-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span className="font-medium text-sm">{mealTimeInfo[meal.type].label}</span>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  size="sm"
                  onPress={() => removeMeal(mealIndex)}
                >
                  <Trash2 size={14} />
                </Button>
              </CardHeader>
              <CardBody className="pt-0 space-y-2">
                {meal.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2">
                    <Input
                      size="sm"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...meal.items];
                        newItems[itemIndex] = { ...item, name: e.target.value };
                        updateMeal(mealIndex, { ...meal, items: newItems });
                      }}
                      className="flex-1"
                    />
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => {
                        updateMeal(mealIndex, {
                          ...meal,
                          items: meal.items.filter((_, i) => i !== itemIndex),
                        });
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Plus size={14} />}
                  onPress={() => {
                    updateMeal(mealIndex, {
                      ...meal,
                      items: [...meal.items, { name: "", dietary: [], isAvailable: true }],
                    });
                  }}
                >
                  Add Item
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="light" onPress={onClose}>
          Cancel
        </Button>
        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={!name || meals.length === 0}
          startContent={<Save size={16} />}
        >
          {template ? "Update" : "Create"} Template
        </Button>
      </div>
    </div>
  );
}

export default function AdminMenuTemplatesPage() {
  const { templates } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [editingTemplate, setEditingTemplate] = useState<SerializedMenuTemplate | undefined>();

  const handleCreate = () => {
    setEditingTemplate(undefined);
    onOpen();
  };

  const handleEdit = (template: SerializedMenuTemplate) => {
    setEditingTemplate(template);
    onOpen();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const formData = new FormData();
      formData.set("intent", "delete");
      formData.set("id", id);
      submit(formData, { method: "post" });
    }
  };

  const handleSetDefault = (id: string) => {
    const formData = new FormData();
    formData.set("intent", "set-default");
    formData.set("id", id);
    submit(formData, { method: "post" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button as={Link} to="/admin/menus" variant="light" isIconOnly>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Templates</h1>
            <p className="text-gray-500">Create reusable menu templates</p>
          </div>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={handleCreate}>
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="py-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No Templates Yet</h3>
            <p className="text-gray-500 mb-4">
              Create templates to quickly set up recurring menus
            </p>
            <Button color="primary" startContent={<Plus size={18} />} onPress={handleCreate}>
              Create First Template
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <h3 className="font-semibold">{template.name}</h3>
                </div>
                {template.isDefault && (
                  <Chip size="sm" color="primary" variant="flat" startContent={<Star size={12} />}>
                    Default
                  </Chip>
                )}
              </CardHeader>
              <Divider />
              <CardBody className="space-y-3">
                {template.description && (
                  <p className="text-sm text-gray-500">{template.description}</p>
                )}

                <div className="space-y-1">
                  {template.meals.map((meal) => {
                    const Icon = mealIcons[meal.type];
                    return (
                      <div key={meal.type} className="flex items-center gap-2 text-sm">
                        <Icon size={14} className="text-gray-400" />
                        <span className="text-gray-600">{mealTimeInfo[meal.type].label}:</span>
                        <span className="text-gray-900">{meal.items.length} items</span>
                      </div>
                    );
                  })}
                </div>

                <Divider />

                <div className="flex gap-1">
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<Edit size={14} />}
                    onPress={() => handleEdit(template)}
                  >
                    Edit
                  </Button>
                  {!template.isDefault && (
                    <Button
                      variant="light"
                      size="sm"
                      onPress={() => handleSetDefault(template.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="light"
                    size="sm"
                    color="danger"
                    isIconOnly
                    onPress={() => handleDelete(template.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                {editingTemplate ? "Edit Template" : "Create Template"}
              </ModalHeader>
              <ModalBody>
                <TemplateEditor template={editingTemplate} onClose={onClose} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
