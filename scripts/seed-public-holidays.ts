/**
 * Script to seed Ghana Public Holidays & Observances for 2026
 * Run with: npm run db:seed-holidays
 */

import mongoose from "mongoose";
import { connectToDatabase, disconnectFromDatabase } from "../app/lib/db/connection.server";

// Inline Event schema to avoid server-only import issues
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

// Ghana Public Holidays & Observances 2026
const holidaysData = [
  // Public Holidays (offices/banks closed)
  {
    title: "New Year's Day",
    date: "2026-01-01",
    isPublicHoliday: true,
    description: "New Year's Day is a public holiday in Ghana. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Constitution Day",
    date: "2026-01-07",
    isPublicHoliday: true,
    description: "Constitution Day marks the anniversary of the 1993 Fourth Republican Constitution. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Independence Day",
    date: "2026-03-06",
    isPublicHoliday: true,
    description: "Ghana Independence Day celebrates freedom from British colonial rule on March 6, 1957. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Good Friday",
    date: "2026-04-03",
    isPublicHoliday: true,
    description: "Good Friday is a public holiday in Ghana observed by Christians nationwide. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Easter Monday",
    date: "2026-04-06",
    isPublicHoliday: true,
    description: "Easter Monday is a public holiday in Ghana. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "May Day (Workers' Day)",
    date: "2026-05-01",
    isPublicHoliday: true,
    description: "May Day celebrates workers and the labour movement in Ghana. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Eid al-Fitr",
    date: "2026-03-20",
    isPublicHoliday: true,
    description: "Eid al-Fitr marks the end of Ramadan. Date may vary based on moon sighting. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Eid al-Adha",
    date: "2026-05-27",
    isPublicHoliday: true,
    description: "Eid al-Adha (Festival of Sacrifice) is observed by Muslims across Ghana. Date may vary based on moon sighting. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Republic Day",
    date: "2026-07-01",
    isPublicHoliday: true,
    description: "Republic Day marks Ghana becoming a republic on July 1, 1960. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Founders' Day",
    date: "2026-08-04",
    isPublicHoliday: true,
    description: "Founders' Day honours all those who contributed to Ghana's independence struggle. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Kwame Nkrumah Memorial Day",
    date: "2026-09-21",
    isPublicHoliday: true,
    description: "Kwame Nkrumah Memorial Day honours Ghana's first president and his contributions to independence. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Farmer's Day",
    date: "2026-12-04",
    isPublicHoliday: true,
    description: "Farmer's Day celebrates the contribution of farmers to Ghana's economy. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Christmas Day",
    date: "2026-12-25",
    isPublicHoliday: true,
    description: "Christmas Day is a public holiday in Ghana celebrated nationwide. Government offices, banks, and most businesses will be closed.",
  },
  {
    title: "Boxing Day",
    date: "2026-12-26",
    isPublicHoliday: true,
    description: "Boxing Day is a public holiday in Ghana. Government offices, banks, and most businesses will be closed.",
  },

  // Notable Observances (not official holidays but widely recognized)
  {
    title: "Valentine's Day",
    date: "2026-02-14",
    isPublicHoliday: false,
    description: "Valentine's Day is observed in Ghana as a day of love and affection.",
  },
  {
    title: "International Women's Day",
    date: "2026-03-08",
    isPublicHoliday: false,
    description: "International Women's Day celebrates the achievements and contributions of women in Ghana and worldwide.",
  },
  {
    title: "World Health Day",
    date: "2026-04-07",
    isPublicHoliday: false,
    description: "World Health Day raises awareness about global health issues. Observed across Ghana's healthcare sector.",
  },
  {
    title: "World Day for Safety and Health at Work",
    date: "2026-04-28",
    isPublicHoliday: false,
    description: "Promoting safe, healthy, and decent work environments. Particularly relevant for mining operations at ARL.",
  },
  {
    title: "Africa Day",
    date: "2026-05-25",
    isPublicHoliday: false,
    description: "Africa Day celebrates the founding of the Organisation of African Unity (now African Union) and African unity.",
  },
  {
    title: "World Environment Day",
    date: "2026-06-05",
    isPublicHoliday: false,
    description: "World Environment Day encourages environmental awareness and action. ARL is committed to responsible mining practices.",
  },
  {
    title: "International Youth Day",
    date: "2026-08-12",
    isPublicHoliday: false,
    description: "International Youth Day celebrates the role of young people in society and development.",
  },
  {
    title: "International Day of Peace",
    date: "2026-09-21",
    isPublicHoliday: false,
    description: "The International Day of Peace is devoted to strengthening the ideals of peace among all nations.",
  },
  {
    title: "World Mental Health Day",
    date: "2026-10-10",
    isPublicHoliday: false,
    description: "World Mental Health Day raises awareness about mental health issues. ARL supports employee wellbeing.",
  },
  {
    title: "United Nations Day",
    date: "2026-10-24",
    isPublicHoliday: false,
    description: "United Nations Day marks the anniversary of the UN Charter coming into force in 1945.",
  },
  {
    title: "World AIDS Day",
    date: "2026-12-01",
    isPublicHoliday: false,
    description: "World AIDS Day raises awareness about HIV/AIDS. ARL supports health awareness across the workforce.",
  },
];

async function seedPublicHolidays() {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Get admin user for createdBy field
    let admin = await AdminUser.findOne({ role: "superadmin" });
    if (!admin) {
      admin = await AdminUser.findOne({});
    }
    if (!admin) {
      console.error("No admin user found. Please create one first.");
      process.exit(1);
    }
    console.log(`Using admin: ${admin.name || admin.email}`);

    // Check for existing holiday events
    const existingCount = await Event.countDocuments({
      category: { $in: ["Public Holiday", "Observance"] },
    });
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing holiday/observance events. Clearing and reseeding...`);
      await Event.deleteMany({
        category: { $in: ["Public Holiday", "Observance"] },
      });
    }

    let imported = 0;

    for (const holiday of holidaysData) {
      const slug = slugify(holiday.title);

      const event = new Event({
        title: holiday.title,
        slug,
        description: holiday.description,
        date: new Date(holiday.date),
        time: "All Day",
        location: "Ghana (Nationwide)",
        category: holiday.isPublicHoliday ? "Public Holiday" : "Observance",
        organizer: "Government of Ghana",
        status: "published",
        isFeatured: holiday.isPublicHoliday,
        registrationRequired: false,
        images: [],
        createdBy: admin._id,
      });

      await event.save();
      const marker = holiday.isPublicHoliday ? "🏛️" : "📅";
      console.log(`  ${marker} ${holiday.title} (${holiday.date})`);
      imported++;
    }

    console.log(`\n========================================`);
    console.log(`✅ Seeded ${imported} holidays & observances!`);
    console.log(`   🏛️  Public Holidays: ${holidaysData.filter(h => h.isPublicHoliday).length}`);
    console.log(`   📅 Observances: ${holidaysData.filter(h => !h.isPublicHoliday).length}`);
    console.log(`========================================\n`);

    // Show upcoming events
    const upcoming = await Event.find({
      date: { $gte: new Date() },
      category: { $in: ["Public Holiday", "Observance"] },
    }).sort({ date: 1 }).limit(5);

    if (upcoming.length > 0) {
      console.log("Next upcoming holidays:");
      upcoming.forEach((e) => {
        const dateStr = new Date(e.date).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        console.log(`  → ${e.title} - ${dateStr} (${e.category})`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await disconnectFromDatabase();
    process.exit(0);
  }
}

seedPublicHolidays();
