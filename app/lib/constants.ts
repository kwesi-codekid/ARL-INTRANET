/**
 * Application Constants
 * Shared constants used across the application
 */

// Department structure for ARL - Official departments
export const DEPARTMENTS = [
  // Operations
  { code: "MINING", name: "Mining", category: "Operations" },
  { code: "GEO", name: "Geology", category: "Operations" },
  { code: "EXPL", name: "Exploration", category: "Operations" },
  { code: "ENG", name: "Engineering", category: "Operations" },
  { code: "PROC", name: "Process", category: "Operations" },
  { code: "SURV", name: "Survey", category: "Operations" },
  { code: "NTL", name: "NTL", category: "Operations" },
  { code: "TSF", name: "TSF", category: "Operations" },
  { code: "HME", name: "HME", category: "Operations" },
  // Support
  { code: "HR", name: "HR & Admin", category: "Support" },
  { code: "FIN", name: "Finance", category: "Support" },
  { code: "SCM", name: "Supply", category: "Support" },
  { code: "IT", name: "IT", category: "Support" },
  { code: "COMM", name: "Commercial", category: "Support" },
  { code: "SEC", name: "Security", category: "Support" },
  { code: "SRD", name: "SRD", category: "Support" },
  { code: "ACCRA", name: "Accra Office", category: "Support" },
  // HSE & Safety
  { code: "HSE", name: "HSE", category: "HSE" },
  { code: "SHSESG", name: "SHSESG", category: "HSE" },
  // DFSL
  { code: "DFSL", name: "DFSL", category: "DFSL" },
] as const;

export type Department = (typeof DEPARTMENTS)[number];
export type DepartmentCode = Department["code"];
export type DepartmentCategory = Department["category"];

// Get department by code
export function getDepartmentByCode(code: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.code === code);
}

// Get departments by category
export function getDepartmentsByCategory(category: DepartmentCategory): Department[] {
  return DEPARTMENTS.filter((d) => d.category === category);
}
