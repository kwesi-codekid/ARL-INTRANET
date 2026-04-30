/**
 * Bulk import portal users from an Excel file.
 *
 * Source file: C:\Users\Dell\Desktop\portal users.xlsx
 * Sheet columns: employeeId | (blank) | department | email | fullName | phoneNumber
 *
 * Run with:  npx tsx scripts/import-portal-users-xlsx.ts
 *
 * Skips users that already exist (matched by phone or email).
 */

import mongoose from "mongoose";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const SOURCE_FILE = "C:\\Users\\Dell\\Desktop\\portal users.xlsx";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/arl_intranet";

// ----- Inline schemas (avoid importing .server modules from a script) -----
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
    employeeId: { type: String, trim: true, sparse: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
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
  (mongoose.models.Department as mongoose.Model<any>) ||
  mongoose.model("Department", DepartmentSchema);
const AdminUser =
  (mongoose.models.AdminUser as mongoose.Model<any>) ||
  mongoose.model("AdminUser", AdminUserSchema);
const User =
  (mongoose.models.User as mongoose.Model<any>) ||
  mongoose.model("User", UserSchema);

// ----- Department name → code mapping -----
const DEPT_MAP: Record<string, string> = {
  SECURITY: "SEC",
  ENGINEERING: "ENG",
  "HR/ADMIN": "HR",
  HR: "HR",
  MINING: "MINING",
  EXPLORATION: "EXPL",
  PROCESSING: "PROC",
  PROCESS: "PROC",
  GEOLOGY: "GEO",
  HSE: "HSE",
  "HSE CLINIC": "HSE",
  "HSE SAFETY": "HSE",
  SHSESG: "SHSESG",
  SRD: "SRD",
  SUPPLY: "SCM",
  "SUPPLY CHAIN": "SCM",
  FINANCE: "FIN",
  IT: "IT",
  COMMERCIAL: "COMM",
  // No "Management" dept exists — bucket under HR & Admin (1 person)
  MANAGEMENT: "HR",
};

// ----- Helpers -----
function formatGhanaPhone(input: string | number | undefined | null): string | null {
  if (input === undefined || input === null || input === "") return null;
  // numeric values from xlsx lose the leading zero
  let raw = typeof input === "number" ? String(input) : String(input);
  let cleaned = raw.replace(/\D/g, "");
  if (!cleaned) return null;
  if (cleaned === "0") return null;

  if (cleaned.startsWith("233")) {
    // already country-coded
  } else if (cleaned.startsWith("0")) {
    cleaned = "233" + cleaned.slice(1);
  } else if (cleaned.length === 9) {
    // leading zero stripped by Excel number coercion
    cleaned = "233" + cleaned;
  } else {
    cleaned = "233" + cleaned;
  }

  if (!/^233[0-9]{9}$/.test(cleaned)) return null;
  return cleaned;
}

function cleanName(raw: string): string {
  // xlsx sometimes decodes the source's UTF-8 NBSP (0xC2 0xA0) as latin-1,
  // leaving a stray U+00C2 (Â) before the NBSP. Strip it before collapsing.
  const collapsed = raw
    .replace(/Â/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return collapsed
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      // keep initials like "K." capitalised
      if (/^[a-z]\.$/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function normaliseEmail(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const e = String(raw).trim().toLowerCase();
  if (!e || !/^\S+@\S+\.\S+$/.test(e)) return undefined;
  return e;
}

interface RawRow {
  employeeId?: string;
  department?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string | number;
}

async function run() {
  console.log(`Source: ${SOURCE_FILE}`);
  console.log("Reading workbook...");
  const wb = XLSX.readFile(SOURCE_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" });
  console.log(`Rows in file: ${rows.length}\n`);

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected\n");

  // Build dept code → _id lookup
  const allDepts = await Department.find({}).lean();
  const deptByCode: Record<string, mongoose.Types.ObjectId> = {};
  for (const d of allDepts) {
    deptByCode[d.code] = d._id;
  }

  // Verify every code we map to actually exists
  const missingCodes = [...new Set(Object.values(DEPT_MAP))].filter(
    (c) => !deptByCode[c]
  );
  if (missingCodes.length) {
    console.error(`ERROR: Missing department codes in DB: ${missingCodes.join(", ")}`);
    console.error("Run db:seed-departments first.");
    process.exit(1);
  }

  const superadmin = await AdminUser.findOne({ role: "superadmin" });
  if (!superadmin) {
    console.error("ERROR: No superadmin found. Create one first.");
    process.exit(1);
  }
  console.log(`Created by: ${superadmin.name} (${superadmin._id})\n`);

  let created = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  let failed = 0;
  const unknownDepts = new Set<string>();
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lineNo = i + 2; // +1 for header, +1 for 1-based

    const rawName = r.fullName ? String(r.fullName) : "";
    const phone = formatGhanaPhone(r.phoneNumber);
    const email = normaliseEmail(r.email);
    const employeeId = r.employeeId ? String(r.employeeId).trim() : undefined;
    const deptRaw = r.department ? String(r.department).trim().toUpperCase() : "";

    if (!rawName.trim()) {
      skippedInvalid++;
      continue;
    }
    const name = cleanName(rawName);

    if (!phone) {
      errors.push(`row ${lineNo}: invalid/missing phone for ${name}`);
      skippedInvalid++;
      continue;
    }

    const deptCode = DEPT_MAP[deptRaw];
    if (!deptCode) {
      unknownDepts.add(deptRaw);
      errors.push(`row ${lineNo}: unknown department '${deptRaw}' for ${name}`);
      skippedInvalid++;
      continue;
    }
    const departmentId = deptByCode[deptCode];

    // existence checks
    const existsByPhone = await User.findOne({ phone }).lean();
    if (existsByPhone) {
      skippedExisting++;
      continue;
    }
    if (email) {
      const existsByEmail = await User.findOne({ email }).lean();
      if (existsByEmail) {
        skippedExisting++;
        continue;
      }
    }

    try {
      await User.create({
        employeeId,
        name,
        phone,
        email,
        department: departmentId,
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
      created++;
      if (created % 25 === 0) {
        console.log(`  ...created ${created} so far`);
      }
    } catch (err: any) {
      const msg = err?.code === 11000 ? "duplicate key" : err?.message ?? String(err);
      errors.push(`row ${lineNo}: failed for ${name} (${phone}) — ${msg}`);
      failed++;
    }
  }

  console.log("\n========== IMPORT SUMMARY ==========");
  console.log(`Total rows:        ${rows.length}`);
  console.log(`Created:           ${created}`);
  console.log(`Skipped (exists):  ${skippedExisting}`);
  console.log(`Skipped (invalid): ${skippedInvalid}`);
  console.log(`Failed:            ${failed}`);

  if (unknownDepts.size) {
    console.log(`\nUnknown department names: ${[...unknownDepts].join(", ")}`);
  }
  if (errors.length) {
    console.log("\nIssues:");
    errors.slice(0, 50).forEach((e) => console.log(`  - ${e}`));
    if (errors.length > 50) console.log(`  ...and ${errors.length - 50} more`);
  }
  console.log("====================================\n");

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Fatal error:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
