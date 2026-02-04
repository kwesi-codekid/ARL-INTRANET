/**
 * User CRUD Service
 * Handles portal user management (admin-only operations)
 */

import { User, type IUser, type UserRole, type UserLocation } from "~/lib/db/models/user.server";
import { Department } from "~/lib/db/models/contact.server";
import { connectDB } from "~/lib/db/connection.server";
import { formatGhanaPhone, isValidGhanaPhone } from "./sms.server";
import { isValidEmail, normalizeEmail } from "./email.server";
import type { Types } from "mongoose";

interface CreateUserInput {
  employeeId?: string;
  name: string;
  phone: string;
  email?: string;
  departmentId: string;
  position: string;
  location: UserLocation;
  role: UserRole;
  permissions?: string[];
  createdBy: string; // Admin ID
}

interface UpdateUserInput {
  employeeId?: string;
  name?: string;
  email?: string;
  departmentId?: string;
  position?: string;
  location?: UserLocation;
  role?: UserRole;
  permissions?: string[];
}

interface UserResult {
  success: boolean;
  message: string;
  user?: IUser;
}

interface UsersListResult {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ListUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  role?: UserRole;
  location?: UserLocation;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Create a new portal user (admin only)
 */
export async function createUser(input: CreateUserInput): Promise<UserResult> {
  await connectDB();

  const { name, phone, email, departmentId, position, location, role, permissions, createdBy, employeeId } = input;

  // Validate phone
  if (!isValidGhanaPhone(phone)) {
    return { success: false, message: "Invalid Ghana phone number" };
  }

  const formattedPhone = formatGhanaPhone(phone);

  // Check if phone already exists
  const existingPhone = await User.findOne({ phone: formattedPhone });
  if (existingPhone) {
    return { success: false, message: "Phone number already registered" };
  }

  // Validate and normalize email if provided
  let normalizedEmail: string | undefined;
  if (email) {
    if (!isValidEmail(email)) {
      return { success: false, message: "Invalid email address" };
    }
    normalizedEmail = normalizeEmail(email);

    // Check if email already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return { success: false, message: "Email already registered" };
    }
  }

  // Validate department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    return { success: false, message: "Department not found" };
  }

  // Validate employee ID uniqueness if provided
  if (employeeId) {
    const existingEmployeeId = await User.findOne({ employeeId });
    if (existingEmployeeId) {
      return { success: false, message: "Employee ID already exists" };
    }
  }

  // Create user
  const user = await User.create({
    employeeId,
    name,
    phone: formattedPhone,
    email: normalizedEmail,
    department: departmentId,
    position,
    location,
    role,
    permissions: permissions || [],
    isActive: true,
    isVerified: false,
    emailVerified: false,
    loginCount: 0,
    createdBy,
  });

  return { success: true, message: "User created successfully", user };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<IUser | null> {
  await connectDB();
  return User.findById(id).populate("department", "name code");
}

/**
 * Get user by phone
 */
export async function getUserByPhone(phone: string): Promise<IUser | null> {
  if (!isValidGhanaPhone(phone)) return null;
  await connectDB();
  const formattedPhone = formatGhanaPhone(phone);
  return User.findOne({ phone: formattedPhone }).populate("department", "name code");
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  if (!isValidEmail(email)) return null;
  await connectDB();
  const normalizedEmail = normalizeEmail(email);
  return User.findOne({ email: normalizedEmail }).populate("department", "name code");
}

/**
 * Update user
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<UserResult> {
  await connectDB();

  const user = await User.findById(id);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  const { name, email, departmentId, position, location, role, permissions, employeeId } = input;

  // Update fields if provided
  if (name !== undefined) user.name = name;
  if (position !== undefined) user.position = position;
  if (location !== undefined) user.location = location;
  if (role !== undefined) user.role = role;
  if (permissions !== undefined) user.permissions = permissions;

  // Handle employee ID update
  if (employeeId !== undefined) {
    if (employeeId && employeeId !== user.employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId, _id: { $ne: id } });
      if (existingEmployeeId) {
        return { success: false, message: "Employee ID already exists" };
      }
    }
    user.employeeId = employeeId || undefined;
  }

  // Handle email update
  if (email !== undefined) {
    if (email) {
      if (!isValidEmail(email)) {
        return { success: false, message: "Invalid email address" };
      }
      const normalizedEmail = normalizeEmail(email);
      if (normalizedEmail !== user.email) {
        const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
        if (existingEmail) {
          return { success: false, message: "Email already registered" };
        }
        user.email = normalizedEmail;
        user.emailVerified = false; // Reset verification on email change
      }
    } else {
      user.email = undefined;
      user.emailVerified = false;
    }
  }

  // Handle department update
  if (departmentId !== undefined) {
    const department = await Department.findById(departmentId);
    if (!department) {
      return { success: false, message: "Department not found" };
    }
    user.department = departmentId as unknown as Types.ObjectId;
  }

  await user.save();

  return { success: true, message: "User updated successfully", user };
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(id: string): Promise<UserResult> {
  await connectDB();

  const user = await User.findById(id);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  user.isActive = !user.isActive;
  await user.save();

  return {
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    user,
  };
}

/**
 * Delete user (soft delete by setting inactive, or hard delete)
 */
export async function deleteUser(id: string, hard: boolean = false): Promise<UserResult> {
  await connectDB();

  if (hard) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    return { success: true, message: "User deleted permanently" };
  }

  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) {
    return { success: false, message: "User not found" };
  }

  return { success: true, message: "User deactivated successfully", user };
}

/**
 * List users with pagination and filtering
 */
export async function listUsers(options: ListUsersOptions = {}): Promise<UsersListResult> {
  await connectDB();

  const {
    page = 1,
    limit = 20,
    search,
    departmentId,
    role,
    location,
    isActive,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  // Build query
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
    ];
  }

  if (departmentId) {
    query.department = departmentId;
  }

  if (role) {
    query.role = role;
  }

  if (location) {
    query.location = location;
  }

  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  // Build sort
  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  // Execute query
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query)
      .populate("department", "name code")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users: users as unknown as IUser[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get users count by status
 */
export async function getUserStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  verified: number;
}> {
  await connectDB();

  const [total, active, verified] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isVerified: true }),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    verified,
  };
}

/**
 * Bulk import users from CSV data
 */
export async function bulkCreateUsers(
  users: CreateUserInput[],
  skipErrors: boolean = false
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ index: number; message: string }>;
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ index: number; message: string }>,
  };

  for (let i = 0; i < users.length; i++) {
    const result = await createUser(users[i]);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ index: i, message: result.message });
      if (!skipErrors) break;
    }
  }

  return results;
}
