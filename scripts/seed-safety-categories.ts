/**
 * Script to seed safety categories
 * Run with: npm run db:seed-safety-categories
 */

import { connectToDatabase, disconnectFromDatabase } from "../app/lib/db/connection.server";
import { SafetyCategory } from "../app/lib/db/models/safety-category.server";

const safetyCategoriesData = [
  // Core mining safety
  {
    name: "PPE",
    slug: "ppe",
    description: "Personal Protective Equipment guidelines and requirements for all site personnel",
    icon: "hard-hat",
    color: "#3B82F6",
    order: 1,
    isActive: true,
  },
  {
    name: "Emergency Procedures",
    slug: "emergency-procedures",
    description: "Emergency response protocols including evacuation, muster points, and emergency contacts",
    icon: "siren",
    color: "#EF4444",
    order: 2,
    isActive: true,
  },
  {
    name: "Fire Safety",
    slug: "fire-safety",
    description: "Fire prevention, detection, and response procedures across all site areas",
    icon: "flame",
    color: "#F97316",
    order: 3,
    isActive: true,
  },
  {
    name: "First Aid",
    slug: "first-aid",
    description: "First aid procedures, kit locations, and basic life support guidelines",
    icon: "heart-pulse",
    color: "#EC4899",
    order: 4,
    isActive: true,
  },
  {
    name: "Hazard Awareness",
    slug: "hazard-awareness",
    description: "Identifying, assessing, and reporting workplace hazards on the mine site",
    icon: "alert-triangle",
    color: "#F59E0B",
    order: 5,
    isActive: true,
  },
  {
    name: "Chemical Safety",
    slug: "chemical-safety",
    description: "Safe handling, storage, and disposal of chemicals including cyanide and reagents",
    icon: "flask-conical",
    color: "#8B5CF6",
    order: 6,
    isActive: true,
  },
  {
    name: "Working at Heights",
    slug: "working-at-heights",
    description: "Fall prevention, harness use, and safety procedures for elevated work areas",
    icon: "arrow-up-from-line",
    color: "#06B6D4",
    order: 7,
    isActive: true,
  },
  {
    name: "Confined Spaces",
    slug: "confined-spaces",
    description: "Entry permits, ventilation, and rescue procedures for confined space operations",
    icon: "box",
    color: "#6366F1",
    order: 8,
    isActive: true,
  },
  {
    name: "Vehicle & Mobile Equipment",
    slug: "vehicle-mobile-equipment",
    description: "Safe operation of haul trucks, light vehicles, and mobile equipment on site",
    icon: "truck",
    color: "#0EA5E9",
    order: 9,
    isActive: true,
  },
  {
    name: "Electrical Safety",
    slug: "electrical-safety",
    description: "Lockout/tagout procedures, electrical hazard awareness, and safe work practices",
    icon: "zap",
    color: "#FACC15",
    order: 10,
    isActive: true,
  },
  {
    name: "Noise & Hearing Protection",
    slug: "noise-hearing-protection",
    description: "Noise exposure limits, hearing conservation program, and ear protection requirements",
    icon: "ear",
    color: "#14B8A6",
    order: 11,
    isActive: true,
  },
  {
    name: "Heat Stress",
    slug: "heat-stress",
    description: "Heat illness prevention, hydration guidelines, and work-rest schedules for tropical conditions",
    icon: "thermometer-sun",
    color: "#DC2626",
    order: 12,
    isActive: true,
  },
  {
    name: "Ground Control",
    slug: "ground-control",
    description: "Pit wall stability, bench maintenance, and ground support in open-pit mining operations",
    icon: "mountain",
    color: "#78716C",
    order: 13,
    isActive: true,
  },
  {
    name: "Blasting Safety",
    slug: "blasting-safety",
    description: "Explosives handling, blast exclusion zones, and pre/post-blast safety procedures",
    icon: "bomb",
    color: "#B91C1C",
    order: 14,
    isActive: true,
  },
  {
    name: "Environmental",
    slug: "environmental",
    description: "Environmental protection, spill prevention, dust control, and waste management",
    icon: "leaf",
    color: "#22C55E",
    order: 15,
    isActive: true,
  },
  {
    name: "Housekeeping",
    slug: "housekeeping",
    description: "Workplace organization, cleanliness standards, and trip/slip hazard prevention",
    icon: "sparkles",
    color: "#A855F7",
    order: 16,
    isActive: true,
  },
];

async function seedSafetyCategories() {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Check if categories already exist
    const count = await SafetyCategory.countDocuments();
    if (count > 0) {
      console.log(`Safety categories already exist (${count} found). Clearing and reseeding...`);
      await SafetyCategory.deleteMany({});
    }

    // Insert categories
    await SafetyCategory.insertMany(safetyCategoriesData);
    console.log(`\n✅ Seeded ${safetyCategoriesData.length} safety categories successfully!`);

    // List all categories
    console.log("\nSafety categories created:");
    const categories = await SafetyCategory.find({}).sort({ order: 1 });
    categories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (${cat.slug}) - ${cat.color}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await disconnectFromDatabase();
    process.exit(0);
  }
}

seedSafetyCategories();
