/**
 * Contact Service
 * Task: 1.1.4.1.2, 1.1.4.2.2
 */

import { Contact, Department, type IContact, type IDepartment, type ContactLocation } from "~/lib/db/models/contact.server";
import mongoose from "mongoose";

// ============================================
// Department Functions
// ============================================

export interface DepartmentInput {
  name: string;
  code: string;
  category: "operations" | "support" | "hse" | "dfsl" | "contractors";
  description?: string;
  headOfDepartment?: string;
  isActive?: boolean;
  order?: number;
}

export async function createDepartment(data: DepartmentInput): Promise<IDepartment> {
  const department = new Department(data);
  await department.save();
  return department;
}

export async function updateDepartment(
  id: string,
  data: Partial<DepartmentInput>
): Promise<IDepartment | null> {
  return Department.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteDepartment(id: string): Promise<boolean> {
  // Check if department has contacts
  const contactCount = await Contact.countDocuments({ department: id });
  if (contactCount > 0) {
    throw new Error(`Cannot delete department with ${contactCount} contacts`);
  }

  const result = await Department.findByIdAndDelete(id);
  return !!result;
}

export async function getDepartmentById(id: string): Promise<IDepartment | null> {
  return Department.findById(id).populate("headOfDepartment");
}

export async function getDepartmentByCode(code: string): Promise<IDepartment | null> {
  return Department.findOne({ code: code.toUpperCase() });
}

export interface GetDepartmentsOptions {
  category?: string;
  isActive?: boolean;
  includeInactive?: boolean;
}

export async function getDepartments(options: GetDepartmentsOptions = {}): Promise<IDepartment[]> {
  const filter: Record<string, unknown> = {};

  if (options.category) {
    filter.category = options.category;
  }

  if (!options.includeInactive) {
    filter.isActive = true;
  } else if (options.isActive !== undefined) {
    filter.isActive = options.isActive;
  }

  return Department.find(filter)
    .populate("headOfDepartment")
    .sort({ category: 1, order: 1, name: 1 });
}

export async function getDepartmentStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
}> {
  const [total, byCategory] = await Promise.all([
    Department.countDocuments({ isActive: true }),
    Department.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const categoryMap: Record<string, number> = {};
  byCategory.forEach((item) => {
    categoryMap[item._id] = item.count;
  });

  return { total, byCategory: categoryMap };
}

// ============================================
// Contact Functions
// ============================================

export interface ContactInput {
  name: string;
  phone: string;
  phoneExtension?: string;
  email?: string;
  department: string;
  position: string;
  photo?: string;
  isEmergencyContact?: boolean;
  isManagement?: boolean;
  location?: ContactLocation;
  isActive?: boolean;
}

export async function createContact(data: ContactInput): Promise<IContact> {
  const contact = new Contact(data);
  await contact.save();
  return contact.populate("department");
}

export async function updateContact(
  id: string,
  data: Partial<ContactInput>
): Promise<IContact | null> {
  const contact = await Contact.findById(id);
  if (!contact) return null;

  Object.assign(contact, data);
  await contact.save();
  return contact.populate("department");
}

export async function deleteContact(id: string): Promise<boolean> {
  const result = await Contact.findByIdAndDelete(id);
  return !!result;
}

export async function getContactById(id: string): Promise<IContact | null> {
  return Contact.findById(id).populate("department");
}

export interface GetContactsOptions {
  department?: string;
  search?: string;
  letter?: string; // First letter of last name for A-Z navigation
  isEmergencyContact?: boolean;
  isManagement?: boolean;
  location?: ContactLocation;
  isActive?: boolean;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedContacts {
  contacts: IContact[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getContacts(options: GetContactsOptions = {}): Promise<PaginatedContacts> {
  const filter: Record<string, unknown> = {};
  const page = options.page || 1;
  const limit = options.limit || 50;

  if (options.department) {
    filter.department = options.department;
  }

  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: "i" } },
      { position: { $regex: options.search, $options: "i" } },
      { phone: { $regex: options.search, $options: "i" } },
      { email: { $regex: options.search, $options: "i" } },
    ];
  }

  // Filter by first letter of name (A-Z navigation)
  if (options.letter) {
    filter.name = { $regex: `^${options.letter}`, $options: "i" };
  }

  if (options.isEmergencyContact !== undefined) {
    filter.isEmergencyContact = options.isEmergencyContact;
  }

  if (options.isManagement !== undefined) {
    filter.isManagement = options.isManagement;
  }

  if (options.location) {
    filter.location = options.location;
  }

  if (!options.includeInactive) {
    filter.isActive = true;
  } else if (options.isActive !== undefined) {
    filter.isActive = options.isActive;
  }

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .populate("department")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Contact.countDocuments(filter),
  ]);

  return {
    contacts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getContactsByDepartment(departmentId: string): Promise<IContact[]> {
  return Contact.find({ department: departmentId, isActive: true })
    .populate("department")
    .sort({ name: 1 });
}

export async function getEmergencyContacts(): Promise<IContact[]> {
  return Contact.find({ isEmergencyContact: true, isActive: true })
    .populate("department")
    .sort({ name: 1 });
}

export async function searchContacts(query: string, limit = 10): Promise<IContact[]> {
  return Contact.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: "i" } },
      { position: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
    ],
  })
    .populate("department")
    .sort({ name: 1 })
    .limit(limit);
}

export async function getContactLetters(): Promise<string[]> {
  const result = await Contact.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: { $toUpper: { $substr: ["$name", 0, 1] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return result.map((r) => r._id).filter((letter) => /^[A-Z]$/.test(letter));
}

export async function getContactStats(): Promise<{
  total: number;
  emergency: number;
  management: number;
  siteContacts: number;
  headOfficeContacts: number;
  byDepartment: Array<{ department: string; count: number }>;
}> {
  const [total, emergency, management, siteContacts, headOfficeContacts, byDepartment] = await Promise.all([
    Contact.countDocuments({ isActive: true }),
    Contact.countDocuments({ isActive: true, isEmergencyContact: true }),
    Contact.countDocuments({ isActive: true, isManagement: true }),
    Contact.countDocuments({ isActive: true, location: "site" }),
    Contact.countDocuments({ isActive: true, location: "head-office" }),
    Contact.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      { $project: { department: "$dept.name", count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return { total, emergency, management, siteContacts, headOfficeContacts, byDepartment };
}

export async function getManagementContacts(): Promise<IContact[]> {
  return Contact.find({ isManagement: true, isActive: true })
    .populate("department")
    .sort({ name: 1 });
}

export async function getContactsByLocation(location: ContactLocation): Promise<IContact[]> {
  return Contact.find({ location, isActive: true })
    .populate("department")
    .sort({ name: 1 });
}

// ============================================
// CSV Import
// ============================================

export interface CSVContactRow {
  name: string;
  phone: string;
  phoneExtension?: string;
  email?: string;
  departmentCode: string;
  position: string;
  isEmergencyContact?: string;
  isManagement?: string;
  location?: string;
}

export interface CSVImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export async function importContactsFromCSV(rows: CSVContactRow[]): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  // Pre-fetch all departments
  const departments = await Department.find({ isActive: true });
  const deptMap = new Map(departments.map((d) => [d.code.toUpperCase(), d._id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Account for header row and 0-index

    try {
      // Validate required fields
      if (!row.name) {
        throw new Error("Name is required");
      }
      if (!row.phone) {
        throw new Error("Phone number is required");
      }
      if (!row.departmentCode) {
        throw new Error("Department code is required");
      }
      if (!row.position) {
        throw new Error("Position is required");
      }

      // Find department
      const departmentId = deptMap.get(row.departmentCode.toUpperCase());
      if (!departmentId) {
        throw new Error(`Department not found: ${row.departmentCode}`);
      }

      // Parse location (default to "site" if not specified or invalid)
      const locationValue = row.location?.toLowerCase().trim();
      const location: ContactLocation = locationValue === "head-office" || locationValue === "accra"
        ? "head-office"
        : "site";

      // Create contact
      await createContact({
        name: row.name.trim(),
        phone: row.phone.trim(),
        phoneExtension: row.phoneExtension?.trim(),
        email: row.email?.trim(),
        department: departmentId.toString(),
        position: row.position.trim(),
        isEmergencyContact: row.isEmergencyContact?.toLowerCase() === "yes" ||
                           row.isEmergencyContact?.toLowerCase() === "true",
        isManagement: row.isManagement?.toLowerCase() === "yes" ||
                      row.isManagement?.toLowerCase() === "true",
        location,
      });

      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: rowNum,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
