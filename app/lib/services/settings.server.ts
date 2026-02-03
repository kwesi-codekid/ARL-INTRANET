/**
 * Settings Service
 * Manage system-wide settings
 */

import { connectDB } from "~/lib/db/connection.server";
import { Settings, DEFAULT_SETTINGS, type ISettings, type SettingsKey } from "~/lib/db/models/settings.server";

// Cache for settings to avoid repeated DB calls
let settingsCache: Map<string, any> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Initialize default settings in database if they don't exist
 */
export async function initializeSettings(): Promise<void> {
  await connectDB();

  for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await Settings.findOne({ key });
    if (!existing) {
      await Settings.create({
        key,
        value: config.value,
        type: config.type,
        category: config.category,
        description: config.description,
      });
    }
  }
}

/**
 * Get a single setting value
 */
export async function getSetting<T = any>(key: SettingsKey): Promise<T> {
  await connectDB();

  // Check cache first
  if (settingsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    if (settingsCache.has(key)) {
      return settingsCache.get(key) as T;
    }
  }

  const setting = await Settings.findOne({ key }).lean();
  if (setting) {
    return setting.value as T;
  }

  // Return default if not found
  const defaultConfig = DEFAULT_SETTINGS[key];
  return (defaultConfig?.value ?? null) as T;
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Record<string, any>> {
  await connectDB();

  // Check cache
  if (settingsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return Object.fromEntries(settingsCache);
  }

  const settings = await Settings.find().lean();
  const result: Record<string, any> = {};

  // Start with defaults
  for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
    result[key] = config.value;
  }

  // Override with DB values
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }

  // Update cache
  settingsCache = new Map(Object.entries(result));
  cacheTimestamp = Date.now();

  return result;
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(category: string): Promise<ISettings[]> {
  await connectDB();
  return Settings.find({ category }).lean();
}

/**
 * Update a single setting
 */
export async function updateSetting(
  key: SettingsKey,
  value: any,
  updatedBy?: string
): Promise<ISettings | null> {
  await connectDB();

  const defaultConfig = DEFAULT_SETTINGS[key];
  if (!defaultConfig) {
    throw new Error(`Unknown setting: ${key}`);
  }

  // Validate type
  const expectedType = defaultConfig.type;
  if (expectedType === "boolean" && typeof value !== "boolean") {
    value = value === "true" || value === true;
  } else if (expectedType === "number" && typeof value !== "number") {
    value = Number(value);
  }

  const result = await Settings.findOneAndUpdate(
    { key },
    {
      value,
      updatedBy: updatedBy || undefined,
    },
    { new: true, upsert: true }
  ).lean();

  // Invalidate cache
  clearSettingsCache();

  return result;
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(
  updates: Partial<Record<SettingsKey, any>>,
  updatedBy?: string
): Promise<void> {
  await connectDB();

  const operations = Object.entries(updates).map(([key, value]) => {
    const defaultConfig = DEFAULT_SETTINGS[key as SettingsKey];
    if (!defaultConfig) return null;

    // Type coercion
    if (defaultConfig.type === "boolean") {
      value = value === "true" || value === true;
    } else if (defaultConfig.type === "number") {
      value = Number(value);
    }

    return {
      updateOne: {
        filter: { key },
        update: {
          $set: {
            value,
            type: defaultConfig.type,
            category: defaultConfig.category,
            description: defaultConfig.description,
            updatedBy: updatedBy || undefined,
          },
        },
        upsert: true,
      },
    };
  }).filter(Boolean);

  if (operations.length > 0) {
    await Settings.bulkWrite(operations as any);
  }

  // Invalidate cache
  clearSettingsCache();
}

/**
 * Clear settings cache
 */
export function clearSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

/**
 * Check if maintenance mode is enabled
 */
export async function isMaintenanceMode(): Promise<boolean> {
  return getSetting<boolean>("maintenanceMode");
}

/**
 * Get maintenance message
 */
export async function getMaintenanceMessage(): Promise<string> {
  return getSetting<string>("maintenanceMessage");
}

/**
 * Get session timeout in hours
 */
export async function getSessionTimeout(): Promise<number> {
  return getSetting<number>("sessionTimeoutHours");
}

/**
 * Get all settings formatted for the admin UI
 */
export async function getSettingsForAdmin(): Promise<{
  general: Record<string, any>;
  notifications: Record<string, any>;
  security: Record<string, any>;
  system: Record<string, any>;
}> {
  const allSettings = await getAllSettings();

  const result = {
    general: {} as Record<string, any>,
    notifications: {} as Record<string, any>,
    security: {} as Record<string, any>,
    system: {} as Record<string, any>,
  };

  for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
    const category = config.category as keyof typeof result;
    result[category][key] = allSettings[key];
  }

  return result;
}
