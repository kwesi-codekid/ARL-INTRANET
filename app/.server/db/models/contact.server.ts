import mongoose, { Document, Model, Schema } from "mongoose";
import { DEPARTMENTS } from "~/lib/constants";

/**
 * Extract department codes from DEPARTMENTS constant
 */
export const DEPARTMENT_CODES = DEPARTMENTS.map((d) => d.code);
export type DepartmentCode = (typeof DEPARTMENT_CODES)[number];

/**
 * Contact document interface
 */
export interface IContact {
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneExtension?: string;
  alternatePhone?: string;
  email?: string;
  department: DepartmentCode;
  position: string;
  photo?: string;
  location?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contact document with Mongoose Document methods
 */
export interface IContactDocument extends IContact, Document {}

/**
 * Contact model static methods
 */
export interface IContactModel extends Model<IContactDocument> {
  findByDepartment(
    department: DepartmentCode
  ): mongoose.Query<IContactDocument[], IContactDocument>;
  searchContacts(query: string): mongoose.Query<IContactDocument[], IContactDocument>;
}

/**
 * Contact schema definition
 */
const contactSchema = new Schema<IContactDocument, IContactModel>(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    phoneExtension: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: {
        values: DEPARTMENT_CODES,
        message: "{VALUE} is not a valid department",
      },
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },
    photo: {
      type: String,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
contactSchema.index({ department: 1, sortOrder: 1, name: 1 });
contactSchema.index({ isActive: 1 });
contactSchema.index({ phone: 1 });
contactSchema.index(
  { name: "text", position: "text", department: "text" },
  { weights: { name: 10, position: 5, department: 2 } }
);

/**
 * Pre-save middleware: Generate full name from first and last name
 */
contactSchema.pre("save", function () {
  if (this.isModified("firstName") || this.isModified("lastName")) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  }
});

/**
 * Static method: Find contacts by department
 */
contactSchema.statics.findByDepartment = function (department: DepartmentCode) {
  return this.find({ department, isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });
};

/**
 * Static method: Search contacts
 */
contactSchema.statics.searchContacts = function (query: string) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
};

/**
 * Contact model
 */
export const Contact =
  (mongoose.models.Contact as IContactModel) ||
  mongoose.model<IContactDocument, IContactModel>("Contact", contactSchema);
