import { Department } from "../models";

export const departmentsSeedData = [
  // Operations
  { name: "Mining", code: "MINING", category: "operations", order: 1 },
  { name: "Geology", code: "GEO", category: "operations", order: 2 },
  { name: "Exploration", code: "EXPL", category: "operations", order: 3 },
  { name: "Engineering", code: "ENG", category: "operations", order: 4 },
  { name: "Process", code: "PROC", category: "operations", order: 5 },
  { name: "Survey", code: "SURV", category: "operations", order: 6 },
  { name: "NTL", code: "NTL", category: "operations", order: 7 },
  { name: "TSF", code: "TSF", category: "operations", order: 8 },
  { name: "HME", code: "HME", category: "operations", order: 9 },

  // Support
  { name: "HR & Admin", code: "HR", category: "support", order: 1 },
  { name: "Finance", code: "FIN", category: "support", order: 2 },
  { name: "Supply", code: "SCM", category: "support", order: 3 },
  { name: "IT", code: "IT", category: "support", order: 4 },
  { name: "Commercial", code: "COMM", category: "support", order: 5 },
  { name: "Security", code: "SEC", category: "support", order: 6 },
  { name: "SRD", code: "SRD", category: "support", order: 7 },
  { name: "Accra Office", code: "ACCRA", category: "support", order: 8 },

  // HSE & Safety
  { name: "HSE", code: "HSE", category: "hse", order: 1 },
  { name: "SHSESG", code: "SHSESG", category: "hse", order: 2 },

  // DFSL (Damang Food Services Limited)
  { name: "DFSL", code: "DFSL", category: "dfsl", order: 1 },
] as const;

export async function seedDepartments(): Promise<void> {
  const count = await Department.countDocuments();
  if (count > 0) {
    console.log("Departments already seeded, skipping...");
    return;
  }

  await Department.insertMany(departmentsSeedData);
  console.log(`Seeded ${departmentsSeedData.length} departments`);
}
