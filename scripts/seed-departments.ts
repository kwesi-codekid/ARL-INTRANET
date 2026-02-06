/**
 * Script to seed company departments
 * Run with: npm run db:seed-departments
 */

import { connectToDatabase, disconnectFromDatabase } from "../app/lib/db/connection.server";
import { Department } from "../app/lib/db/models/contact.server";

const departmentsData = [
  // Operations
  { name: "Mining", code: "MINING", category: "operations", order: 1, isActive: true },
  { name: "Geology", code: "GEO", category: "operations", order: 2, isActive: true },
  { name: "Exploration", code: "EXPL", category: "operations", order: 3, isActive: true },
  { name: "Engineering", code: "ENG", category: "operations", order: 4, isActive: true },
  { name: "Process", code: "PROC", category: "operations", order: 5, isActive: true },
  { name: "Survey", code: "SURV", category: "operations", order: 6, isActive: true },
  { name: "NTL", code: "NTL", category: "operations", order: 7, isActive: true },
  { name: "TSF", code: "TSF", category: "operations", order: 8, isActive: true },
  { name: "HME", code: "HME", category: "operations", order: 9, isActive: true },

  // Support
  { name: "HR & Admin", code: "HR", category: "support", order: 1, isActive: true },
  { name: "Finance", code: "FIN", category: "support", order: 2, isActive: true },
  { name: "Supply", code: "SCM", category: "support", order: 3, isActive: true },
  { name: "IT", code: "IT", category: "support", order: 4, isActive: true },
  { name: "Commercial", code: "COMM", category: "support", order: 5, isActive: true },
  { name: "Security", code: "SEC", category: "support", order: 6, isActive: true },
  { name: "SRD", code: "SRD", category: "support", order: 7, isActive: true },
  { name: "Accra Office", code: "ACCRA", category: "support", order: 8, isActive: true },

  // HSE & Safety
  { name: "HSE", code: "HSE", category: "hse", order: 1, isActive: true },
  { name: "SHSESG", code: "SHSESG", category: "hse", order: 2, isActive: true },

  // DFSL (Damang Food Services Limited)
  { name: "DFSL", code: "DFSL", category: "dfsl", order: 1, isActive: true },
];

async function seedDepartments() {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Check if departments already exist
    const count = await Department.countDocuments();
    if (count > 0) {
      console.log(`Departments already exist (${count} found). Clearing and reseeding...`);
      await Department.deleteMany({});
    }

    // Insert departments
    await Department.insertMany(departmentsData);
    console.log(`\n✅ Seeded ${departmentsData.length} departments successfully!`);

    // List all departments
    console.log("\nDepartments created:");
    const departments = await Department.find({}).sort({ category: 1, order: 1 });
    departments.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name} (${dept.code}) - ${dept.category}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await disconnectFromDatabase();
    process.exit(0);
  }
}

seedDepartments();
