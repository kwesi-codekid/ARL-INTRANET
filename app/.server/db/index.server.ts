/**
 * Database Module - Main Exports
 *
 * Usage in route loaders:
 * ```typescript
 * import { connectDB, News } from '~/.server/db/index.server';
 *
 * export async function loader() {
 *   await connectDB();
 *   const articles = await News.find({ status: 'published' }).lean();
 *   return { articles };
 * }
 * ```
 */

// Connection utilities
export {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  mongoose,
} from "./connection.server";

// Models and types
export {
  // Admin
  Admin,
  ADMIN_ROLES,
  type AdminRole,
  type IOtp,
  type IAdmin,
  type IAdminDocument,
  type IAdminModel,
  // News
  News,
  NEWS_CATEGORIES,
  NEWS_STATUSES,
  type NewsCategory,
  type NewsStatus,
  type INewsImage,
  type INews,
  type INewsDocument,
  type INewsModel,
  // Contact
  Contact,
  DEPARTMENT_CODES,
  type DepartmentCode,
  type IContact,
  type IContactDocument,
  type IContactModel,
  // AppLink
  AppLink,
  APP_LINK_CATEGORIES,
  ICON_TYPES,
  type AppLinkCategory,
  type IconType,
  type IAppLink,
  type IAppLinkDocument,
  type IAppLinkModel,
} from "./models/index.server";
