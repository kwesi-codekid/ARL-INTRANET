/**
 * Menu Model
 * Task: 1.2.4.1.1 - Create Menu schema (date, meals, items, type: daily/weekly)
 * Task: 1.2.4.1.2 - Create MenuItem schema (name, description, dietary info)
 */

import mongoose, { Schema } from "mongoose";
import type { Document, Model, Types } from "mongoose";

// Dietary types
export type DietaryType = "vegetarian" | "vegan" | "halal" | "gluten-free" | "dairy-free" | "nut-free" | "spicy";

// Meal types
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

// Menu item interface
export interface IMenuItem {
  name: string;
  description?: string;
  dietary: DietaryType[];
  isAvailable: boolean;
}

// Meal interface
export interface IMeal {
  type: MealType;
  items: IMenuItem[];
  startTime?: string; // e.g., "06:00"
  endTime?: string;   // e.g., "09:00"
}

// Menu interface
export interface IMenu extends Document {
  date: Date;
  meals: IMeal[];
  isActive: boolean;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Menu Item sub-schema
const MenuItemSchema = new Schema<IMenuItem>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  dietary: [{
    type: String,
    enum: ["vegetarian", "vegan", "halal", "gluten-free", "dairy-free", "nut-free", "spicy"],
  }],
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

// Meal sub-schema
const MealSchema = new Schema<IMeal>({
  type: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    required: true,
  },
  items: [MenuItemSchema],
  startTime: String,
  endTime: String,
}, { _id: false });

// Main Menu Schema
const MenuSchema = new Schema<IMenu>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    meals: [MealSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique date
MenuSchema.index({ date: 1 }, { unique: true });

// Menu Template interface for reusable templates
export interface IMenuTemplate extends Document {
  name: string;
  description?: string;
  meals: IMeal[];
  isDefault: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Menu Template Schema
const MenuTemplateSchema = new Schema<IMenuTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    meals: [MealSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
export const Menu: Model<IMenu> =
  mongoose.models.Menu || mongoose.model<IMenu>("Menu", MenuSchema);

export const MenuTemplate: Model<IMenuTemplate> =
  mongoose.models.MenuTemplate || mongoose.model<IMenuTemplate>("MenuTemplate", MenuTemplateSchema);
