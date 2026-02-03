import * as fs from "fs";
import * as path from "path";
import { Contact, Department } from "../models";
import type { ContactLocation } from "../models/contact.server";

// Map CSV section headers to department codes
const sectionToDepartment: Record<string, string> = {
  "ACCRA OFFICE": "ACCRA",
  "PLANT SITE": "HR",
  "COMMERCIAL": "COMM",
  "HUMAN RESOURCE/ADMINISTRATION": "HR",
  "HR & ADMIN": "HR",
  "HR&ADMIN": "HR",
  "FINANCE": "FIN",
  "SUPPLY": "SCM",
  "INFORMATION TECHNOLOGY": "IT",
  "IT": "IT",
  "Safety,Health,Security,Environmental,Social, and Governance (SHSESG)": "SHSESG",
  "SHSESG": "SHSESG",
  "HSE": "HSE",
  "SECURITY": "SEC",
  "SRD": "SRD",
  "GEOLOGY": "GEO",
  "EXPLORATION": "EXPL",
  "ENGINEERING": "ENG",
  "MINING": "MINING",
  "PROCESS": "PROC",
  "PROCESS PLANT": "PROC",
  "SURVEY": "SURV",
  "NTL": "NTL",
  "TSF": "TSF",
  "HME": "HME",
  "DFSL": "DFSL",
};

// Positions that indicate management roles
const managementKeywords = [
  "COO",
  "CEO",
  "General Manager",
  "GM",
  "Manager",
  "Superintendent",
  "Chief",
  "Controller",
  "Consultant",
  "Head",
  "Director",
];

function isManagementPosition(position: string): boolean {
  const positionLower = position.toLowerCase();
  return managementKeywords.some((keyword) =>
    positionLower.includes(keyword.toLowerCase())
  );
}

function cleanPhone(phone: string): string {
  if (!phone || phone === "-") return "";
  // Remove spaces and special characters, keep only digits
  return phone.replace(/[^0-9]/g, "");
}

function cleanExtension(ext: string): string {
  if (!ext || ext === "-") return "";
  // Handle extensions like "1109/1110" - take the first one
  if (ext.includes("/")) {
    ext = ext.split("/")[0];
  }
  return ext.replace(/[^0-9]/g, "");
}

interface ParsedContact {
  position: string;
  name: string;
  extension: string;
  phone: string;
  departmentCode: string;
  location: ContactLocation;
}

function parseCSV(csvContent: string): ParsedContact[] {
  const lines = csvContent.split("\n");
  const contacts: ParsedContact[] = [];

  let currentDepartmentCode = "ADMIN";
  let currentLocation: ContactLocation = "site";
  let isAccraOffice = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Remove line number prefix (e.g., "     3→")
    const cleanLine = line.replace(/^\s*\d+→/, "").trim();
    if (!cleanLine) continue;

    // Parse CSV fields (handle quoted fields)
    const fields = parseCSVLine(cleanLine);

    // Skip header row
    if (fields[0] === "POSITION" || fields[0] === "INTERNAL TELEPHONE DIRECTORY") {
      continue;
    }

    // Check for section headers
    const firstField = fields[0]?.trim() || "";
    const secondField = fields[1]?.trim() || "";

    // Detect section headers (empty second field usually indicates a header)
    if (firstField && !secondField && !fields[2] && !fields[3]) {
      // This is likely a section header
      const sectionName = firstField.replace(/[",]/g, "").trim();

      if (sectionName === "ACCRA OFFICE") {
        isAccraOffice = true;
        currentLocation = "head-office";
        currentDepartmentCode = "EXEC";
      } else if (sectionName === "PLANT SITE") {
        isAccraOffice = false;
        currentLocation = "site";
        currentDepartmentCode = "ADMIN";
      } else if (sectionToDepartment[sectionName]) {
        currentDepartmentCode = sectionToDepartment[sectionName];
        if (!isAccraOffice) {
          currentLocation = "site";
        }
      }
      continue;
    }

    // Parse contact data
    const position = fields[0]?.trim().replace(/"/g, "") || "";
    const name = fields[1]?.trim().replace(/"/g, "") || "";
    const extension = fields[2]?.trim().replace(/"/g, "") || "";
    const phone = fields[3]?.trim().replace(/"/g, "") || "";

    // Skip if no name or name matches position (placeholder entries)
    if (!name || name === position || name === "-") {
      continue;
    }

    // Skip generic/placeholder entries
    if (
      name.includes("Office") ||
      name.includes("Room") ||
      name.includes("Point") ||
      name.includes("Kitchen") ||
      name.includes("Archive") ||
      name.includes("Bridge") ||
      name.includes("Travels") ||
      name.includes("Gate") ||
      name.includes("Desk")
    ) {
      continue;
    }

    const cleanedPhone = cleanPhone(phone);
    const cleanedExt = cleanExtension(extension);

    // Only add if we have a valid phone number
    if (cleanedPhone || cleanedExt) {
      contacts.push({
        position,
        name,
        extension: cleanedExt,
        phone: cleanedPhone,
        departmentCode: currentDepartmentCode,
        location: currentLocation,
      });
    }
  }

  return contacts;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

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

export async function seedContacts(): Promise<void> {
  // Check if contacts already exist
  const existingCount = await Contact.countDocuments();
  if (existingCount > 0) {
    console.log(`Contacts already exist (${existingCount}), skipping import...`);
    return;
  }

  // Read CSV file
  const csvPath = path.join(process.cwd(), "contacts_import.csv");

  if (!fs.existsSync(csvPath)) {
    console.log("contacts_import.csv not found, skipping contact import...");
    return;
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parsedContacts = parseCSV(csvContent);

  console.log(`Parsed ${parsedContacts.length} contacts from CSV`);

  // Get all departments
  const departments = await Department.find({});
  const deptMap = new Map(departments.map((d) => [d.code, d._id]));

  // Prepare contacts for insertion
  const contactsToInsert = [];
  const skipped: string[] = [];

  for (const contact of parsedContacts) {
    const departmentId = deptMap.get(contact.departmentCode);

    if (!departmentId) {
      skipped.push(`${contact.name} (no dept: ${contact.departmentCode})`);
      continue;
    }

    contactsToInsert.push({
      name: contact.name,
      position: contact.position,
      phone: contact.phone || "N/A",
      phoneExtension: contact.extension || undefined,
      department: departmentId,
      location: contact.location,
      isManagement: isManagementPosition(contact.position),
      isEmergencyContact: false,
      isActive: true,
    });
  }

  if (contactsToInsert.length > 0) {
    await Contact.insertMany(contactsToInsert);
    console.log(`Imported ${contactsToInsert.length} contacts`);
  }

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} contacts:`, skipped.slice(0, 5));
  }

  // Summary
  const managementCount = contactsToInsert.filter((c) => c.isManagement).length;
  const headOfficeCount = contactsToInsert.filter((c) => c.location === "head-office").length;
  const siteCount = contactsToInsert.filter((c) => c.location === "site").length;

  console.log(`  - Management: ${managementCount}`);
  console.log(`  - Head Office (Accra): ${headOfficeCount}`);
  console.log(`  - Site: ${siteCount}`);
}

// Export for running standalone
export async function runContactsImport(): Promise<void> {
  const { connectToDatabase, disconnectFromDatabase } = await import("../connection.server");

  try {
    await connectToDatabase();
    await seedContacts();
  } finally {
    await disconnectFromDatabase();
  }
}
