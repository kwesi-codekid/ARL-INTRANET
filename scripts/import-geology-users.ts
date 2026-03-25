/**
 * Import Geology portal users from "Copy of Geology names.xlsx"
 * Run with: npx tsx scripts/import-geology-users.ts
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

// Users from "Copy of Geology names.xlsx"
const rawUsers = [
  { name: "NDERFO  ACKAH", email: "aknderfo@adamusgh.com", phone: "0542776239" },
  { name: "ABDULAI  FRANCIS", email: "fabdulai@adamusgh.com", phone: "0244660615" },
  { name: "QUAYSON  RICHMOND", email: "rquayson@adamusgh.com", phone: "0556220943" },
  { name: "NYAMEKYE ADUSU  FREDERICK", email: "fnadusu@adamusgh.com", phone: "0540550005" },
  { name: "ADDISON  ALEX PAA KWESI", email: "aaddison@adamusgh.com", phone: "0559435909" },
  { name: "GYAPONG  KWAKU", email: "agyeikyere81@gmail.com", phone: "0248461329" },
  { name: "BAAH  RICHMOND", email: "rbaah@adamusgh.com", phone: "0550729719" },
  { name: "OPOKU GYIMAH  BENJAIMIN", email: "bogyimah@adamusgh.com", phone: "0532083658" },
  { name: "OWUSU  BRIGHT", email: "bowusu@adamusgh.com", phone: "0243062253" },
  { name: "HERBERT HANS  HILARION", email: "hhhans@adamusgh.com", phone: "0559539030" },
  { name: "ATUAHENE  EMMANUEL", email: "eatuahene@adamusgh.com", phone: "0244835175" },
  { name: "MENSAH  SETH", email: "smensah@admusgh.com", phone: "0543786628" },
  { name: "AMPONSAH  MONISTER", email: "mamponsah@adamusgh.com", phone: "0559444545" },
  { name: "OSEI  NATHANIEL", email: "nochamp19@gmail.com", phone: "0553553873" },
  { name: "NUHU  SHAIBU", email: "snuhu@adamusgh.com", phone: "0548076448" },
  { name: "EDUKU  JAMES", email: "", phone: "0246386853" },
  { name: "SACKEY  SAMUEL", email: "Samuelsackey1976@gmail.co", phone: "0243460918" },
  { name: "IDUN  TONY", email: "", phone: "0249539247" },
  { name: "DANSO  MAXWELL", email: "Maxwelldanso86@gmail.com", phone: "0547661076" },
  { name: "ASAMOAH  FRANK", email: "frankasamoah235@gmail.com", phone: "0246220402" },
  { name: "SOBO BLAY  SYLVESTER", email: "ssobo@adamusgh.com", phone: "0247787898" },
  { name: "DERY  PETER", email: "pderry@adamusgh.com", phone: "0246540952" },
  { name: "OTOO- BOATENG  FRANCIS", email: "", phone: "0244766363" },
  { name: "BOAKO  EDWARD", email: "edwardboako@gemail.com", phone: "0541243215" },
  { name: "BENJAMIN GYIMAH", email: "bogyimah@adamusgh.com", phone: "0243879584" },
  { name: "COBBINAH  HANNAH", email: "hchemel@adamusgh.com", phone: "0245608833" },
  { name: "KOFI ADJEI KYERE", email: "agyeikyere81@gmail.com", phone: "0248461329" },
  { name: "YANKEY  JEFF M.", email: "jmyankey@adamusgh.com", phone: "0540955322" },
  { name: "ESSUAH  STEVE KEN", email: "skessuah@adamusgh.com", phone: "0542787728" },
  { name: "ADONGO  WILLIAM", email: "wadongo@adamusgh.com", phone: "0246176903" },
  { name: "ACKAH  JOHN", email: "ajohn@adamusgh.com", phone: "0243566132" },
  { name: "ARMOO  EBENEZER", email: "earmoo@adamusgh.com", phone: "0550203472" },
  { name: "YAW BARIMAH  COLLINS", email: "collinsyawbarimah86@gmail.com", phone: "0246142581" },
  { name: "ATANGA  JAMES", email: "jatanga@adamusgh.com", phone: "0249656190" },
  { name: "OBENG  ISAAC", email: "iobeng@adamusgh.com", phone: "0558838336" },
  { name: "ACKAH  PHILIP", email: "packah@adamusgh.com", phone: "0556161589" },
  { name: "KWOFIE  EVANS", email: "ekwofie@adamusgh.com", phone: "0240193445" },
  { name: "BENTUM  AMOS", email: "abentum@adamusgh.com", phone: "0541458120" },
  { name: "AYEBAH  ISSA", email: "iayebah@adamusgh.com", phone: "0244803237" },
  { name: "ALLUH  GIDEON", email: "kwawalluh@gmail.com", phone: "0244667482" },
  { name: "KOJO  EMMANUEL", email: "ekojo@adamusgh.com", phone: "0245738290" },
  { name: "OBBIN  COLLINS", email: "cobbin@adamusgh.com", phone: "0542487724" },
  { name: "KWOFIE  BISMARK", email: "kbismark@adamusgh.com", phone: "0246983245" },
  { name: "ERZUAH  ISAAC", email: "ierzuah@adamusgh.com", phone: "0543315098" },
  { name: "CUDJOE  NESTA", email: "ncudjoe@adamusgh.com", phone: "0547917100" },
  { name: "KWAW  ANDREW", email: "aliissahqwertyuiop@gmail.com", phone: "0241650917" },
  { name: "ARMOO  TITUS", email: "armootitus@gmail.com", phone: "0243652569" },
  { name: "APPIAH  ERIC", email: "aeric@adamusgh.com", phone: "0249102711" },
  { name: "ACHEAMPONG  JUSTICE", email: "ekowenyam@gmail.com", phone: "0249538979" },
  { name: "FAMEYEH  ALFRED", email: "afameyeh@adamusgh.com", phone: "0245176710" },
  { name: "SAIM  ISAAC", email: "isaim@adamusgh.com", phone: "0547545499" },
  { name: "TIASE  MAVIS", email: "mtiase@adamusgh.com", phone: "0556157006" },
  { name: "AMA AGYAPOMA QUAYSON", email: "aaquayson@adamusgh.com", phone: "0554995255" },
  { name: "ISHMAEL TANDOH", email: "tandohebo9@gmail.com", phone: "0248470994" },
  { name: "DANIEL ALADE", email: "danielalade1980@gmail.com", phone: "0249284728" },
  { name: "STEPHEN CUDJOE", email: "", phone: "0593526692" },
  { name: "DANIEL APPIAH", email: "danielappiah471@gmail.co", phone: "0545451531" },
  { name: "EMMANUEL AIDOO", email: "", phone: "0242817111" },
  { name: "AMOS BENTUM", email: "", phone: "0541458120" },
];

async function importUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // Find Geology department
    const geologyDept = await Department.findOne({ code: "GEO" });
    if (!geologyDept) {
      console.error("ERROR: Geology department not found. Run db:seed first.");
      process.exit(1);
    }
    console.log(`Department: ${geologyDept.name} (${geologyDept._id})`);

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
          department: geologyDept._id,
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
