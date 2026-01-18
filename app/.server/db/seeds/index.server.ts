import { connectDB, disconnectDB } from "../connection.server";
import { Admin } from "../models/admin.server";
import { News } from "../models/news.server";
import { Contact } from "../models/contact.server";
import { AppLink } from "../models/app-link.server";
import {
  adminSeeds,
  newsSeeds,
  contactSeeds,
  appLinkSeeds,
} from "./initial-data.server";

/**
 * Seed options
 */
interface SeedOptions {
  force?: boolean;
}

/**
 * Check if collection has data
 */
async function hasData(model: { countDocuments: () => Promise<number> }): Promise<boolean> {
  const count = await model.countDocuments();
  return count > 0;
}

/**
 * Seed admins collection
 */
async function seedAdmins(force: boolean): Promise<void> {
  if (!force && (await hasData(Admin))) {
    console.log("  - Admins: skipped (data exists)");
    return;
  }

  if (force) {
    await Admin.deleteMany({});
    console.log("  - Admins: cleared existing data");
  }

  await Admin.insertMany(adminSeeds);
  console.log(`  - Admins: inserted ${adminSeeds.length} records`);
}

/**
 * Seed news collection
 */
async function seedNews(force: boolean): Promise<void> {
  if (!force && (await hasData(News))) {
    console.log("  - News: skipped (data exists)");
    return;
  }

  if (force) {
    await News.deleteMany({});
    console.log("  - News: cleared existing data");
  }

  await News.insertMany(newsSeeds);
  console.log(`  - News: inserted ${newsSeeds.length} records`);
}

/**
 * Seed contacts collection
 */
async function seedContacts(force: boolean): Promise<void> {
  if (!force && (await hasData(Contact))) {
    console.log("  - Contacts: skipped (data exists)");
    return;
  }

  if (force) {
    await Contact.deleteMany({});
    console.log("  - Contacts: cleared existing data");
  }

  await Contact.insertMany(contactSeeds);
  console.log(`  - Contacts: inserted ${contactSeeds.length} records`);
}

/**
 * Seed app links collection
 */
async function seedAppLinks(force: boolean): Promise<void> {
  if (!force && (await hasData(AppLink))) {
    console.log("  - AppLinks: skipped (data exists)");
    return;
  }

  if (force) {
    await AppLink.deleteMany({});
    console.log("  - AppLinks: cleared existing data");
  }

  await AppLink.insertMany(appLinkSeeds);
  console.log(`  - AppLinks: inserted ${appLinkSeeds.length} records`);
}

/**
 * Run all seeds
 */
export async function runSeeds(options: SeedOptions = {}): Promise<void> {
  const { force = false } = options;

  console.log("\n🌱 Starting database seeding...\n");
  console.log(`  Mode: ${force ? "FORCE (will clear existing data)" : "SAFE (skip if data exists)"}\n`);

  try {
    await connectDB();
    console.log("📦 Seeding collections:\n");

    await seedAdmins(force);
    await seedNews(force);
    await seedContacts(force);
    await seedAppLinks(force);

    console.log("\n✅ Database seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Database seeding failed:", error);
    throw error;
  } finally {
    await disconnectDB();
  }
}

/**
 * CLI execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");

  try {
    await runSeeds({ force });
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

// Run if executed directly
main();
