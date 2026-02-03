/**
 * Import Ghana National Holidays into Events
 * Run: npx tsx scripts/import-holidays.ts
 */

import mongoose from "mongoose";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

// Event Schema (inline to avoid import issues)
const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    content: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    endDate: { type: Date },
    time: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    locationDetails: { type: String, trim: true },
    featuredImage: { type: String },
    images: [{ type: String }],
    category: { type: String, trim: true },
    organizer: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    registrationRequired: { type: Boolean, default: false },
    registrationLink: { type: String, trim: true },
    maxAttendees: { type: Number },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", required: true },
  },
  { timestamps: true }
);

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

// AdminUser Schema
const AdminUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
});
const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat("-2026");
}

function excelDateToJS(excelDate: number): Date {
  return new Date((excelDate - 25569) * 86400 * 1000);
}

async function importHolidays() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in environment");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get or create admin user
    let admin = await AdminUser.findOne({ role: "superadmin" });
    if (!admin) {
      admin = await AdminUser.findOne({});
    }
    if (!admin) {
      console.error("No admin user found. Please create one first.");
      process.exit(1);
    }
    console.log("Using admin:", admin.name || admin.email);

    // Read Excel file
    const filePath = "c:/Users/Dell/Desktop/adamus/Ghana Holidays and Observances 2026.xlsx";
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["Observances List"];
    const data = XLSX.utils.sheet_to_json(sheet) as Array<{
      Date: number;
      Day: string;
      Observance: string;
    }>;

    console.log(`\nFound ${data.length} holidays to import\n`);

    let imported = 0;
    let skipped = 0;

    for (const row of data) {
      const date = excelDateToJS(row.Date);
      const title = row.Observance.trim();
      const slug = slugify(title);

      // Check if already exists
      const existing = await Event.findOne({ slug });
      if (existing) {
        console.log(`⏭️  Skipped (exists): ${title}`);
        skipped++;
        continue;
      }

      // Determine if it's a public holiday or observance
      const publicHolidays = [
        "New Year's Day",
        "Constitution Day",
        "Independence Day",
        "Eid al-Fitr",
        "Good Friday",
        "Easter Monday",
        "May Day",
        "Eid al-Adha",
        "Republic Day",
        "Founders' Day",
        "Kwame Nkrumah Memorial Day",
        "Farmer's Day",
        "Christmas Day",
        "Boxing Day",
      ];

      const isPublicHoliday = publicHolidays.some((h) =>
        title.toLowerCase().includes(h.toLowerCase())
      );

      const event = new Event({
        title,
        slug,
        description: isPublicHoliday
          ? `${title} is a public holiday in Ghana. Government offices, banks, and most businesses will be closed.`
          : `${title} is observed in Ghana on this day.`,
        date,
        time: "All Day",
        location: "Ghana (Nationwide)",
        category: isPublicHoliday ? "Public Holiday" : "Observance",
        organizer: "Government of Ghana",
        status: "published",
        isFeatured: isPublicHoliday,
        registrationRequired: false,
        images: [],
        createdBy: admin._id,
      });

      await event.save();
      console.log(`✅ Imported: ${title} (${date.toDateString()})`);
      imported++;
    }

    console.log(`\n========================================`);
    console.log(`Import complete!`);
    console.log(`  ✅ Imported: ${imported}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

importHolidays();
