/**
 * Fix Contact Department Assignments
 * Maps contacts to correct departments based on position
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load env
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const [key, ...val] = line.split("=");
    if (key && val.length) {
      process.env[key.trim()] = val.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

async function fixDepartments() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db!;

  // Get current departments
  const depts = await db.collection("departments").find({}).toArray();
  const deptByCode: Record<string, any> = {};
  depts.forEach((d) => {
    deptByCode[d.code] = d._id;
  });

  console.log("Departments loaded:", Object.keys(deptByCode).length);

  // Position patterns to department code
  const patterns: [RegExp, string][] = [
    // IT Department
    [/\bit\s/i, "IT"],
    [/\bit$/i, "IT"],
    [/information technology/i, "IT"],
    [/network/i, "IT"],
    [/database/i, "IT"],
    [/helpdesk/i, "IT"],
    [/system admin/i, "IT"],
    [/system developer/i, "IT"],
    [/erp/i, "IT"],
    [/ict/i, "IT"],
    [/software/i, "IT"],
    [/developer/i, "IT"],

    // HR
    [/\bhr\b/i, "HR"],
    [/human resource/i, "HR"],
    [/training/i, "HR"],
    [/payroll/i, "HR"],
    [/personnel/i, "HR"],
    [/admin assistant/i, "HR"],
    [/driver/i, "HR"],
    [/camp/i, "HR"],
    [/catering/i, "HR"],
    [/cleaner/i, "HR"],
    [/janitor/i, "HR"],

    // Finance
    [/finance/i, "FIN"],
    [/accountant/i, "FIN"],
    [/accounts/i, "FIN"],
    [/treasury/i, "FIN"],
    [/payable/i, "FIN"],

    // Supply Chain
    [/supply/i, "SCM"],
    [/procurement/i, "SCM"],
    [/warehouse/i, "SCM"],
    [/store/i, "SCM"],
    [/buyer/i, "SCM"],
    [/expeditor/i, "SCM"],
    [/expiditor/i, "SCM"],

    // Commercial
    [/commercial/i, "COMM"],

    // HSE/Safety
    [/safety/i, "HSE"],
    [/\bhse\b/i, "HSE"],
    [/environment/i, "HSE"],
    [/emergency/i, "HSE"],
    [/ems supervisor/i, "HSE"],

    // SHSESG
    [/shsesg/i, "SHSESG"],

    // Medical/Clinic (assign to HR)
    [/doctor/i, "HR"],
    [/nurse/i, "HR"],
    [/medical/i, "HR"],
    [/clinic/i, "HR"],

    // SRD (Social Responsibility)
    [/srd/i, "SRD"],
    [/community/i, "SRD"],
    [/land access/i, "SRD"],
    [/grievance/i, "SRD"],
    [/laison/i, "SRD"],
    [/liaison/i, "SRD"],

    // Exploration
    [/exploration/i, "EXPL"],

    // Security
    [/security/i, "SEC"],

    // Engineering
    [/engineer/i, "ENG"],
    [/electrical/i, "ENG"],
    [/mechanical/i, "ENG"],
    [/mechnical/i, "ENG"],
    [/maintenance/i, "ENG"],
    [/maintainance/i, "ENG"],
    [/fitter/i, "ENG"],
    [/technician/i, "ENG"],
    [/artisan/i, "ENG"],
    [/welder/i, "ENG"],
    [/boilermaker/i, "ENG"],
    [/instrument/i, "ENG"],
    [/plumber/i, "ENG"],
    [/auto elec/i, "ENG"],

    // HME
    [/vehicle/i, "HME"],
    [/lightvehicle/i, "HME"],
    [/workshop/i, "HME"],

    // Mining
    [/mining/i, "MINING"],
    [/\bmine\b/i, "MINING"],
    [/drill/i, "MINING"],
    [/blast/i, "MINING"],
    [/excavator/i, "MINING"],
    [/loader/i, "MINING"],
    [/truck/i, "MINING"],
    [/operator/i, "MINING"],
    [/pit/i, "MINING"],
    [/dispatcher/i, "MINING"],
    [/general manager/i, "MINING"],
    [/gm secretary/i, "MINING"],
    [/earth work/i, "MINING"],
    [/production/i, "MINING"],
    [/shift supervisor/i, "MINING"],
    [/day.*relief/i, "SEC"],
    [/^staff$/i, "HR"],

    // Geology
    [/geolog/i, "GEO"],
    [/sampl/i, "GEO"],
    [/core/i, "GEO"],

    // Process/Plant
    [/process/i, "PROC"],
    [/plant/i, "PROC"],
    [/metallurg/i, "PROC"],
    [/cil/i, "PROC"],
    [/leach/i, "PROC"],
    [/elution/i, "PROC"],
    [/refinery/i, "PROC"],
    [/assay/i, "PROC"],
    [/laboratory/i, "PROC"],
    [/lab tech/i, "PROC"],
    [/crusher/i, "PROC"],
    [/mill/i, "PROC"],
    [/carbon/i, "PROC"],
    [/reagent/i, "PROC"],
    [/gold room/i, "PROC"],
    [/tailings/i, "PROC"],

    // Survey
    [/survey/i, "SURV"],

    // HME
    [/\bhme\b/i, "HME"],

    // Accra Office (for specific roles)
    [/^coo$/i, "ACCRA"],
    [/group hr/i, "ACCRA"],
    [/group legal/i, "ACCRA"],
    [/group metal/i, "ACCRA"],
    [/front desk/i, "ACCRA"],
    [/license.*permit/i, "ACCRA"],
    [/corporate travel/i, "ACCRA"],
  ];

  // Get all contacts
  const contacts = await db.collection("contacts").find({}).toArray();
  console.log("Total contacts:", contacts.length);

  let updated = 0;
  const noMatch: string[] = [];

  for (const contact of contacts) {
    const pos = (contact.position || "").toLowerCase();
    let matched = false;

    for (const [pattern, code] of patterns) {
      if (pattern.test(pos)) {
        const newDeptId = deptByCode[code];
        if (newDeptId) {
          await db.collection("contacts").updateOne(
            { _id: contact._id },
            { $set: { department: newDeptId } }
          );
          updated++;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      noMatch.push(contact.position || "UNKNOWN");
    }
  }

  console.log("\n========================================");
  console.log("Updated:", updated, "contacts");
  console.log("No match:", noMatch.length, "contacts");

  if (noMatch.length > 0) {
    console.log("\nUnmatched positions:");
    [...new Set(noMatch)].slice(0, 20).forEach((p) => console.log(" -", p));
  }

  // Verify counts per department
  console.log("\n=== Contacts per Department ===");
  for (const [code, id] of Object.entries(deptByCode)) {
    const count = await db.collection("contacts").countDocuments({ department: id });
    if (count > 0) {
      console.log(`${code}: ${count}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

fixDepartments();
