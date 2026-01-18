/**
 * Database Models - Barrel Exports
 */

// Admin model and types
export {
  Admin,
  ADMIN_ROLES,
  type AdminRole,
  type IOtp,
  type IAdmin,
  type IAdminDocument,
  type IAdminModel,
} from "./admin.server";

// News model and types
export {
  News,
  NEWS_CATEGORIES,
  NEWS_STATUSES,
  type NewsCategory,
  type NewsStatus,
  type INewsImage,
  type INews,
  type INewsDocument,
  type INewsModel,
} from "./news.server";

// Contact model and types
export {
  Contact,
  DEPARTMENT_CODES,
  type DepartmentCode,
  type IContact,
  type IContactDocument,
  type IContactModel,
} from "./contact.server";

// AppLink model and types
export {
  AppLink,
  APP_LINK_CATEGORIES,
  ICON_TYPES,
  type AppLinkCategory,
  type IconType,
  type IAppLink,
  type IAppLinkDocument,
  type IAppLinkModel,
} from "./app-link.server";
