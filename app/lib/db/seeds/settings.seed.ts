/**
 * Settings Seed
 * Initialize default settings in database
 */

import { Settings, DEFAULT_SETTINGS } from "../models/settings.server";

export async function seedSettings(): Promise<void> {
  const existingCount = await Settings.countDocuments();

  if (existingCount > 0) {
    console.log("Settings already seeded, skipping...");
    return;
  }

  const settingsToCreate = Object.entries(DEFAULT_SETTINGS).map(([key, config]) => ({
    key,
    value: config.value,
    type: config.type,
    category: config.category,
    description: config.description,
  }));

  await Settings.insertMany(settingsToCreate);
  console.log(`Seeded ${settingsToCreate.length} default settings`);
}
