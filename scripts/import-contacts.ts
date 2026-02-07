/**
 * Standalone script to import contacts from CSV
 * Run with: npx tsx scripts/import-contacts.ts
 */

import * as fs from "fs";
import * as path from "path";
import { connectToDatabase, disconnectFromDatabase } from "../app/lib/db/connection.server";
import { Contact, Department } from "../app/lib/db/models/contact.server";

// Department codes for CSV sections
const sectionToDepartment: Record<string, string> = {
  "ACCRA OFFICE": "EXEC",
  "PLANT SITE": "ADMIN",
  COMMERCIAL: "COMM",
  "HUMAN RESOURCE/ADMINISTRATION": "HR",
  "FINANCE ": "FIN",
  FINANCE: "FIN",
  SUPPLY: "SCM",
  "INFORMATION TECHNOLOGY": "IT",
  "Safety,Health,Security,Environmental,Social, and Governance (SHSESG)": "HSE",
  HSE: "HSE",
  SECURITY: "SEC",
  SRD: "SRD",
  GEOLOGY: "GEO",
  MINING: "MINING",
  "PROCESS PLANT": "PROC",
  "PROCESS MAINTENANCE": "PMAINT",
  NTL: "NTL",
};

// Management position keywords
const managementKeywords = [
  "COO",
  "CEO",
  "General Manager",
  "Manager",
  "Superintendent",
  "Chief",
  "Controller",
  "Consultant",
  "Head",
  "Director",
];

type ContactLocation = "site" | "head-office";

interface ParsedContact {
  position: string;
  name: string;
  extension: string;
  phone: string;
  departmentCode: string;
  location: ContactLocation;
}

function isManagement(position: string): boolean {
  const lower = position.toLowerCase();
  return managementKeywords.some((k) => lower.includes(k.toLowerCase()));
}

function cleanPhone(phone: string): string {
  if (!phone || phone === "-") return "";
  return phone.replace(/[^0-9]/g, "");
}

function cleanExt(ext: string): string {
  if (!ext || ext === "-") return "";
  if (ext.includes("/")) ext = ext.split("/")[0];
  return ext.replace(/[^0-9]/g, "");
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(content: string): ParsedContact[] {
  const lines = content.split("\n");
  const contacts: ParsedContact[] = [];

  let currentDept = "ADMIN";
  let currentLocation: ContactLocation = "site";
  let isAccra = false;

  for (const line of lines) {
    // Remove line number prefix if present
    const cleanLine = line.replace(/^\s*\d+→/, "").trim();
    if (!cleanLine) continue;

    const fields = parseCSVLine(cleanLine);

    // Skip headers
    if (
      fields[0] === "POSITION" ||
      fields[0] === "INTERNAL TELEPHONE DIRECTORY"
    ) {
      continue;
    }

    const first = (fields[0] || "").trim().replace(/"/g, "");
    const second = (fields[1] || "").trim().replace(/"/g, "");
    const third = (fields[2] || "").trim();
    const fourth = (fields[3] || "").trim();

    // Detect section headers (no meaningful data in other columns)
    if (first && !second && !third && !fourth) {
      const section = first.trim();

      if (section === "ACCRA OFFICE") {
        isAccra = true;
        currentLocation = "head-office";
        currentDept = "EXEC";
      } else if (section === "PLANT SITE") {
        isAccra = false;
        currentLocation = "site";
        currentDept = "ADMIN";
      } else if (sectionToDepartment[section]) {
        currentDept = sectionToDepartment[section];
        if (!isAccra) currentLocation = "site";
      }
      continue;
    }

    // Parse contact
    const position = first;
    const name = second;
    const extension = third.replace(/"/g, "");
    const phone = fourth.replace(/"/g, "");

    // Skip invalid entries
    if (!name || name === position || name === "-") continue;

    // Skip generic placeholders
    if (
      name.match(
        /(Office|Room|Point|Kitchen|Archive|Bridge|Travels|Gate|Desk)/i
      )
    ) {
      continue;
    }

    const cleanedPhone = cleanPhone(phone);
    const cleanedExt = cleanExt(extension);

    if (cleanedPhone || cleanedExt) {
      contacts.push({
        position,
        name,
        extension: cleanedExt,
        phone: cleanedPhone,
        departmentCode: currentDept,
        location: currentLocation,
      });
    }
  }

  return contacts;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  // Read CSV
  const csvPath = path.join(process.cwd(), "contacts_import.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("contacts_import.csv not found");
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parsed = parseCSV(csvContent);
  console.log(`Parsed ${parsed.length} contacts from CSV\n`);

  // Ensure departments exist
  const deptCodes = [...new Set(parsed.map((c) => c.departmentCode))];
  console.log("Required departments:", deptCodes);

  // Check/create missing departments
  for (const code of deptCodes) {
    const exists = await Department.findOne({ code });
    if (!exists) {
      console.log(`Creating department: ${code}`);
      await Department.create({
        name: code,
        code,
        category: "support",
        isActive: true,
        order: 99,
      });
    }
  }

  // Get department map
  const departments = await Department.find({});
  const deptMap = new Map(departments.map((d) => [d.code, d._id]));

  // Clear existing contacts
  const deleteResult = await Contact.deleteMany({});
  console.log(`\nDeleted ${deleteResult.deletedCount} existing contacts`);

  // Insert new contacts
  const toInsert = [];
  const skipped: string[] = [];

  for (const c of parsed) {
    const deptId = deptMap.get(c.departmentCode);
    if (!deptId) {
      skipped.push(`${c.name} (no dept: ${c.departmentCode})`);
      continue;
    }

    toInsert.push({
      name: c.name,
      position: c.position || "Staff",
      phone: c.phone || "N/A",
      phoneExtension: c.extension || undefined,
      department: deptId,
      location: c.location,
      isManagement: isManagement(c.position || ""),
      isEmergencyContact: false,
      isActive: true,
    });
  }

  if (toInsert.length > 0) {
    await Contact.insertMany(toInsert);
    console.log(`Imported ${toInsert.length} contacts\n`);
  }

  if (skipped.length > 0) {
    console.log("Skipped:", skipped);
  }

  // Summary
  const mgmt = toInsert.filter((c) => c.isManagement).length;
  const accra = toInsert.filter((c) => c.location === "head-office").length;
  const site = toInsert.filter((c) => c.location === "site").length;

  console.log("\n=== Summary ===");
  console.log(`Total imported: ${toInsert.length}`);
  console.log(`Management: ${mgmt}`);
  console.log(`Head Office (Accra): ${accra}`);
  console.log(`Site: ${site}`);

  await disconnectFromDatabase();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111