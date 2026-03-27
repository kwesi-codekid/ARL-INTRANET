/**
 * Import Mining portal users from "mining xl.xlsx"
 * Reads all 3 sheets: ARL JRN & SRN, Saim, GT (734 total, ~684 with valid data)
 * Run with: npx tsx scripts/import-mining-users.ts
 */

import mongoose from "mongoose";
import XLSX from "xlsx";
import path from "path";

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

// Map Excel department names to DB department codes
const DEPT_NAME_TO_CODE: Record<string, string> = {
  "Mining": "MINING",
  "Geology": "GEO",
  "Exploration": "EXPL",
  "Engineering": "ENG",
  "Processing": "PROC",
  "HR/Admin": "HR",
  "Finance": "FIN",
  "Supply": "SCM",
  "IT": "IT",
  "Security": "SEC",
  "SRD": "SRD",
  "HSE": "HSE",
};

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

interface RawUser {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
}

function readExcelData(): RawUser[] {
  const filePath = path.resolve(
    process.env.EXCEL_PATH || "C:/Users/Dell/Documents/mining xl.xlsx"
  );
  console.log(`Reading Excel file: ${filePath}`);

  const wb = XLSX.readFile(filePath);
  const sheetNames = ["ARL JRN & SRN", "Saim", "GT"];
  const allUsers: RawUser[] = [];

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn(`Sheet "${sheetName}" not found, skipping.`);
      continue;
    }

    const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
    console.log(`Sheet "${sheetName}": ${data.length} rows`);

    for (const row of data) {
      const fullName = row["Full Name"];
      const phone = row["Phone"];
      if (!fullName || !phone) continue;

      allUsers.push({
        employeeId: row["Employee ID"] || "",
        name: String(fullName),
        email: row["Email"] ? String(row["Email"]).trim() : "",
        phone: String(phone).trim(),
        department: row["Department"] ? String(row["Department"]).trim() : "",
      });
    }
  }

  console.log(`Total users extracted: ${allUsers.length}\n`);
  return allUsers;
}

async function importUsers() {
  try {
    // Read Excel data
    const rawUsers = readExcelData();

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // Load all departments into a map
    const departments = await Department.find({ isActive: true });
    const deptMap = new Map<string, any>();
    for (const dept of departments) {
      deptMap.set(dept.code, dept);
    }
    console.log(`Loaded ${departments.length} departments`);

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
    const unmappedDepts = new Set<string>();

    for (const raw of rawUsers) {
      if (!raw.name || !raw.phone) {
        skipped++;
        continue;
      }

      const phone = formatGhanaPhone(raw.phone);
      const name = titleCase(raw.name.replace(/[-]+/g, "-").replace(/\s+/g, " ").trim());
      const email = raw.email ? raw.email.trim().toLowerCase() : "";
      const employeeId = raw.employeeId ? raw.employeeId.trim() : "";

      if (!isValidGhanaPhone(raw.phone)) {
        errors.push(`INVALID PHONE: ${name} (${raw.phone})`);
        failed++;
        continue;
      }

      // Map department name to code, then look up department
      const deptCode = DEPT_NAME_TO_CODE[raw.department];
      if (!deptCode) {
        unmappedDepts.add(raw.department);
        errors.push(`UNMAPPED DEPT: ${name} - "${raw.department}"`);
        failed++;
        continue;
      }

      const dept = deptMap.get(deptCode);
      if (!dept) {
        errors.push(`DEPT NOT FOUND: ${name} - ${deptCode} (${raw.department})`);
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
          employeeId: employeeId || undefined,
          name,
          phone,
          email: email || undefined,
          department: dept._id,
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
        console.log(`CREATED: ${name} (${phone}) [${raw.department}]`);
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

    if (unmappedDepts.size > 0) {
      console.log(`\nUnmapped departments: ${[...unmappedDepts].join(", ")}`);
    }

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
