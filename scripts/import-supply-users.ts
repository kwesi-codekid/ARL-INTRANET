/**
 * Import Supply department portal users from "Supply.xlsx"
 * Run with: npx tsx scripts/import-supply-users.ts
 */

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/arl_intranet";

// Inline schemas to avoid import issues
const DepartmentSchema = new mongoose.Schema({
  name: String,
  code: String,
  category: String,
  isActive: { type: Boolean, default: true },
  order: Number,
});

const AdminUserSchema = new mongoose.Schema({
  phone: String,
  name: String,
  role: { type: String, enum: ["admin", "superadmin"] },
  isActive: { type: Boolean, default: true },
});

const UserSchema = new mongoose.Schema(
  {
    employeeId: String,
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    position: { type: String, required: true },
    location: {
      type: String,
      enum: ["site", "head-office"],
      default: "site",
    },
    role: {
      type: String,
      enum: ["user", "manager", "department_head"],
      default: "user",
    },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    lastLogin: Date,
    lastLoginIP: String,
    loginCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
  },
  { timestamps: true }
);

const Department =
  mongoose.models.Department ||
  mongoose.model("Department", DepartmentSchema);
const AdminUser =
  mongoose.models.AdminUser ||
  mongoose.model("AdminUser", AdminUserSchema);
const User =
  mongoose.models.User || mongoose.model("User", UserSchema);

function formatGhanaPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "233" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("233")) {
    cleaned = "233" + cleaned;
  }
  return cleaned;
}

function isValidGhanaPhone(phone: string): boolean {
  const formatted = formatGhanaPhone(phone);
  return /^233[0-9]{9}$/.test(formatted);
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Users from "Supply.xlsx"
const rawUsers = [
  { name: "ADU KWAW  COSMOS", email: "cadukwaw@adamusgh.com", phone: "0592402056" },
  { name: "RHULE  ISAAC", email: "irhule@adamusgh.com", phone: "0248726556" },
  { name: "NGOAH  ELIZABETH", email: "engoah@adamusgh.com", phone: "0540316049" },
  { name: "NAGRE  RUTH", email: "rznagre@adamusgh.com", phone: "0543675710" },
  { name: "ASEMABA  ANASTASIA", email: "aasekum@adamusgh.com", phone: "0531026123" },
  { name: "BLAY  JOHN", email: "jblay@adamusgh.com", phone: "0544315357" },
  { name: "ACKAH  BENNETH", email: "backah@adamusgh.com", phone: "0246652303" },
  { name: "OBENG-OWUSU  SAMUEL", email: "soowusu@adamusgh.com", phone: "0244645037" },
  { name: "GYENFIE  ERNEST", email: "eegyenfie@adamusgh.com", phone: "0243086313" },
  { name: "Ennison  Charles", email: "cennison@adamusgh.com", phone: "0548397715" },
  { name: "USSIF  UMAR", email: "uusepah@adamusgh.com", phone: "0554726427" },
];

async function importUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // Find Supply department
    const supplyDept = await Department.findOne({ code: "SCM" });
    if (!supplyDept) {
      console.error("ERROR: Supply department (SCM) not found. Run db:seed first.");
      process.exit(1);
    }
    console.log(`Department: ${supplyDept.name} (${supplyDept._id})`);

    // Find superadmin
    const superadmin = await AdminUser.findOne({ role: "superadmin" });
    if (!superadmin) {
      console.error("ERROR: Superadmin not found. Create one first.");
      process.exit(1);
    }
    console.log(`Created by: ${superadmin.name} (${superadmin._id})\n`);

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const raw of rawUsers) {
      // Skip empty rows
      if (!raw.name || !raw.phone) {
        skipped++;
        continue;
      }

      const phone = formatGhanaPhone(raw.phone);
      const name = titleCase(raw.name.replace(/[-]+/g, "-").replace(/\s+/g, " ").trim());
      const email = raw.email ? raw.email.trim().toLowerCase() : "";

      if (!isValidGhanaPhone(raw.phone)) {
        errors.push(`INVALID PHONE: ${name} (${raw.phone})`);
        failed++;
        continue;
      }

      // Check if phone already exists
      const existing = await User.findOne({ phone });
      if (existing) {
        console.log(`SKIP (exists): ${name} - ${phone}`);
        skipped++;
        continue;
      }

      // Check duplicate email
      if (email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          console.log(`SKIP (email exists): ${name} - ${email}`);
          skipped++;
          continue;
        }
      }

      try {
        await User.create({
          name,
          phone,
          email: email || undefined,
          department: supplyDept._id,
          position: "Staff",
          location: "site",
          role: "user",
          permissions: [],
          isActive: true,
          isVerified: false,
          emailVerified: false,
          loginCount: 0,
          createdBy: superadmin._id,
        });
        console.log(`CREATED: ${name} (${phone})`);
        created++;
      } catch (err: any) {
        const msg = err.code === 11000 ? "Duplicate key" : err.message;
        errors.push(`FAILED: ${name} - ${msg}`);
        failed++;
      }
    }

    console.log("\n========== IMPORT SUMMARY ==========");
    console.log(`Total in file:  ${rawUsers.length}`);
    console.log(`Created:        ${created}`);
    console.log(`Skipped:        ${skipped}`);
    console.log(`Failed:         ${failed}`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((e) => console.log(`  - ${e}`));
    }

    console.log("====================================\n");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

importUsers();
