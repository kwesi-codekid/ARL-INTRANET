/**
 * Menu Constants - Shared between client and server
 * These constants can be safely imported in both client and server code
 */

export type DietaryType = "vegetarian" | "vegan" | "halal" | "gluten-free" | "dairy-free" | "nut-free" | "spicy";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

// Dietary info
export const dietaryInfo: Record<DietaryType, { label: string; icon: string; color: string }> = {
  vegetarian: { label: "Vegetarian", icon: "🥬", color: "green" },
  vegan: { label: "Vegan", icon: "🌱", color: "green" },
  halal: { label: "Halal", icon: "☪️", color: "blue" },
  "gluten-free": { label: "Gluten-Free", icon: "🌾", color: "amber" },
  "dairy-free": { label: "Dairy-Free", icon: "🥛", color: "purple" },
  "nut-free": { label: "Nut-Free", icon: "🥜", color: "orange" },
  spicy: { label: "Spicy", icon: "🌶️", color: "red" },
};

// Meal time info
export const mealTimeInfo: Record<MealType, { label: string; defaultStart: string; defaultEnd: string }> = {
  breakfast: { label: "Breakfast", defaultStart: "06:00", defaultEnd: "09:00" },
  lunch: { label: "Lunch", defaultStart: "12:00", defaultEnd: "14:00" },
  dinner: { label: "Dinner", defaultStart: "18:00", defaultEnd: "20:00" },
  snack: { label: "Snack", defaultStart: "15:00", defaultEnd: "16:00" },
};

// Serialized types for client
export interface SerializedMenuItem {
  name: string;
  description?: string;
  dietary: DietaryType[];
  isAvailable: boolean;
}

export interface SerializedMeal {
  type: MealType;
  items: SerializedMenuItem[];
  startTime?: string;
  endTime?: string;
}

export interface SerializedMenu {
  id: string;
  date: string;
  meals: SerializedMeal[];
  isActive: boolean;
  notes?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SerializedMenuTemplate {
  id: string;
  name: string;
  description?: string;
  meals: SerializedMeal[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Client-safe interfaces for form state (mirrors model types)
export interface IMeal {
  type: MealType;
  items: IMenuItem[];
  startTime?: string;
  endTime?: string;
}

export interface IMenuItem {
  name: string;
  description?: string;
  dietary: DietaryType[];
  isAvailable: boolean;
}
