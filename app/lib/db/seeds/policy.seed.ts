/**
 * Seed Policy Categories
 */

import { connectDB } from "~/lib/db/connection.server";
import { PolicyCategory } from "~/lib/db/models/policy.server";

export async function seedPolicyCategories() {
  await connectDB();

  // Check if categories already exist
  const existingCount = await PolicyCategory.countDocuments();
  if (existingCount > 0) {
    console.log("Policy categories already exist, skipping seed");
    return;
  }

  const categories = [
    {
      name: "Human Resources",
      slug: "human-resources",
      description: "HR policies covering employment, benefits, and workplace conduct",
      color: "#3b82f6",
      icon: "users",
      order: 1,
    },
    {
      name: "Health & Safety",
      slug: "health-safety",
      description: "Policies ensuring workplace safety and employee well-being",
      color: "#ef4444",
      icon: "shield",
      order: 2,
    },
    {
      name: "Environmental",
      slug: "environmental",
      description: "Environmental protection and sustainability policies",
      color: "#22c55e",
      icon: "leaf",
      order: 3,
    },
    {
      name: "Operations",
      slug: "operations",
      description: "Operational procedures and guidelines",
      color: "#f59e0b",
      icon: "settings",
      order: 4,
    },
    {
      name: "Finance",
      slug: "finance",
      description: "Financial policies and procedures",
      color: "#8b5cf6",
      icon: "dollar",
      order: 5,
    },
    {
      name: "IT & Security",
      slug: "it-security",
      description: "Information technology and cybersecurity policies",
      color: "#06b6d4",
      icon: "lock",
      order: 6,
    },
    {
      name: "Corporate Governance",
      slug: "corporate-governance",
      description: "Corporate governance and compliance policies",
      color: "#d2ab67",
      icon: "building",
      order: 7,
    },
  ];

  const result = await PolicyCategory.insertMany(categories);
  console.log(`Seeded ${result.length} policy categories`);
  return result;
}
