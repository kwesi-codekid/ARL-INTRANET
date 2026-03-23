/**
 * Import portal users from ex1.xlsx
 * Run with: npx tsx scripts/import-portal-users.ts
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

// Users from ex1.xlsx
const rawUsers = [
  { name: "TOFFEY  EBENEZER", email: "etoffey@adamusgh.com", phone: "0242268233" },
  { name: "ACKAH  WINFRED", email: "wackah@adamusgh.com", phone: "0544123582" },
  { name: "KWAW  MOSES", email: "mkwaw@adamusgh.com", phone: "0592387410" },
  { name: "KAKU  SYLVESTER", email: "skaku@adamusgh.com", phone: "0543787289" },
  { name: "NKRUMAH  BENJAMIN", email: "", phone: "0243671180" },
  { name: "KRAMPAH  ALEX", email: "", phone: "0246690903" },
  { name: "ADU-POKU  EMMANUEL", email: "eapoku@adamusgh.com", phone: "0244474695" },
  { name: "ANDOH  CLEMENT BLAY", email: "cbandoh@adamusgh.com", phone: "0544292008" },
  { name: "ANDERSON  RICHARD YAW", email: "ryanderson@adamusgh.com", phone: "0543889688" },
  { name: "ANNAN  GODFRED", email: "gannan@adamusgh.com", phone: "0201889565" },
  { name: "AMOATEY  DANIEL", email: "damoatey@adamusgh.com", phone: "0246353195" },
  { name: "FORSON  RICHLOVE", email: "rforson@adamusgh.com", phone: "0507737592" },
  { name: "SENZU  MARK", email: "msenzu@adamusgh.com", phone: "0203830677" },
  { name: "ACKAH  JOSHUA", email: "", phone: "0245704591" },
  { name: "OHENE DARKO  TONY NKRUMAH", email: "tnodarko@adamusgh.com", phone: "0542809710" },
  { name: "DUKESON  THOMAS", email: "tdbirch@adamusgh.com", phone: "0246768110" },
  { name: "NYARKO  AMMA", email: "adapaah@adamusgh.com", phone: "0244884798" },
  { name: "AIDOO  REXFORD", email: "", phone: "0542875861" },
  { name: "BRANDOH  PETER", email: "pbrandoh@adamusgh.com", phone: "0244404718" },
  { name: "BOADI  DOUGLAS", email: "dboadi@adamusgh.com", phone: "0545107609" },
  { name: "ZAAR  GILBERT", email: "", phone: "0543412288" },
  { name: "KOOMSON  DAVID", email: "", phone: "0243654909" },
  { name: "EFFISAH  THEOPHILUS", email: "teffisah@adamusgh.com", phone: "0541643389" },
  { name: "COLEMAN  ALEX", email: "", phone: "0243165779" },
  { name: "DWUMAH  BENJAMIN", email: "bdwumah@adamusgh.com", phone: "0243648650" },
  { name: "SENNIE  STEPHEN", email: "senniestephen84@gmail.com", phone: "0248307611" },
  { name: "GAMAYO  FRANK", email: "", phone: "0245334238" },
  { name: "BAFFOE  JOHN", email: "", phone: "0249953392" },
  { name: "NYAME  ROBERT", email: "nrobert@adamusgh.com", phone: "0245486533" },
  { name: "BAAH  BRIGHT", email: "brightmore18@gmail.com", phone: "0543505329" },
  { name: "JOHNSON  ISAAC KWESI", email: "ikjohnson@adamusgh.com", phone: "0244597681" },
  { name: "NDABIAH  FRANCIS", email: "fndabia@adamusgh.com", phone: "0549519546" },
  { name: "GAMADI  RICHARD", email: "", phone: "0542484149" },
  { name: "NUHU  MUNIRU", email: "", phone: "0546238788" },
  { name: "KWESI  THOMAS", email: "", phone: "0247302148" },
  { name: "MENSAH  JACOB", email: "", phone: "0544259986" },
  { name: "MENSAH AGYIMA  DANIEL", email: "damensah@adamusgh.com", phone: "0554963724" },
  { name: "BENSON  BARTHOLOMEW", email: "bbenson@adamusgh.com", phone: "0246233302" },
  { name: "KWOFIE  JOHN", email: "jmkwofie@adamusgh.com", phone: "0241158535" },
  { name: "BADWAH  PASCAL", email: "pabadwah@adamusgh.com", phone: "0557905513" },
  { name: "NWIAH  SIMON", email: "snwiah@adamusgh.com", phone: "0551129024" },
  { name: "ASIEDU  ANTHONY", email: "aasiedu@adamusgh.com", phone: "0540546325" },
  { name: "MENSAH  FAVOUR", email: "mfavour@adamusgh.com", phone: "0247544107" },
  { name: "MONNICHIE KARAH  EMMANUEL", email: "ekmonnichie@adamusgh.com", phone: "0545015146" },
  { name: "AMOAH  VINCENT", email: "vkamoah@adamusgh.com", phone: "0243051716" },
  { name: "APPIAH  LAWRENCE", email: "lappiah@adamusgh.com", phone: "0542097070" },
  { name: "AFFUL  BARTHOLOMEW", email: "beafful@adamusgh.com", phone: "0550592284" },
  { name: "BLAY  ANTHONY", email: "ablay@adamusgh.com", phone: "0249601272" },
  { name: "BLAY  ERNEST", email: "eblay@adamusgh.com", phone: "0530116132" },
  { name: "ARMAH  CLEMENT", email: "carmah@adamusgh.com", phone: "0554911993" },
  { name: "FAMEYAH  STEPHEN", email: "sfameyeh@adamusgh.com", phone: "0549598289" },
  { name: "DANSO  PATRICK", email: "padanso@adamusgh.com", phone: "0552036210" },
  { name: "EYIFAH  JOHN", email: "jeyifah@adamusgh.com", phone: "0544876120" },
  { name: "SMITH  BEN KOJO", email: "bksmith@adamusgh.com", phone: "0245153125" },
  { name: "KWOFIE  GODFRED S.", email: "gskwofie@adamusgh.com", phone: "0546883932" },
  { name: "BARTHOLOMEW BENSON", email: "", phone: "0246233302" },
  { name: "COLEMAN  ESTHER", email: "ecoleman@adamusgh.com", phone: "0249949329" },
  { name: "ACKAH  DOREEN", email: "dackah1@adamusgh.com", phone: "0541744280" },
  { name: "ASANTE  SHADRACK", email: "soansante@adamusgh.com", phone: "0555157941" },
  { name: "COMFORT AMULEY", email: "", phone: "0552350563" },
  { name: "REGINA PENDITA K. BRUCE", email: "", phone: "0203441712" },
  { name: "ROBERT KWARFO ADARKWA", email: "rkadarkwa@adamusgh.com", phone: "0204582602" },
];

async function importUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    // Find Process department
    const processDept = await Department.findOne({ code: "PROC" });
    if (!processDept) {
      console.error("ERROR: Process department not found. Run db:seed first.");
      process.exit(1);
    }
    console.log(`Department: ${processDept.name} (${processDept._id})`);

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
      const name = titleCase(raw.name.replace(/\s+/g, " ").trim());

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
      if (raw.email) {
        const emailExists = await User.findOne({
          email: raw.email.toLowerCase(),
        });
        if (emailExists) {
          console.log(`SKIP (email exists): ${name} - ${raw.email}`);
          skipped++;
          continue;
        }
      }

      try {
        await User.create({
          name,
          phone,
          email: raw.email ? raw.email.toLowerCase() : undefined,
          department: processDept._id,
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
