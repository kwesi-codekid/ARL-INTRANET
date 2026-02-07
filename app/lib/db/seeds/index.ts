import { connectToDatabase, disconnectFromDatabase } from "../connection.server";
import { seedDepartments } from "./departments.seed";
import { seedNewsCategories } from "./news-categories.seed";
import { seedSuggestionCategories } from "./suggestion-categories.seed";
import { seedFAQs } from "./faqs.seed";
import { seedCompanyInfo } from "./company-info.seed";
import { seedPolicyCategories } from "./policy.seed";
import { seedITTips } from "./it-tip.seed";
import { seedExecutiveMessages } from "./executive-message.seed";
import { seedContacts } from "./contacts.seed";
import { seedSettings } from "./settings.seed";

export async function runAllSeeds(): Promise<void> {
  try {
    await connectToDatabase();
    console.log("Starting database seeding...\n");

    await seedDepartments();
    await seedNewsCategories();
    await seedSuggestionCategories();
    await seedFAQs();
    await seedCompanyInfo();
    await seedPolicyCategories();
    await seedITTips();
    await seedExecutiveMessages();
    await seedContacts();
    await seedSettings();

    console.log("\nDatabase seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await disconnectFromDatabase();
  }
}

// Run seeds if executed directly
// Using a more cross-platform compatible check
const isMainModule = process.argv[1]?.includes('seeds') || process.argv[1]?.endsWith('index.ts');
if (isMainModule) {
  runAllSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
