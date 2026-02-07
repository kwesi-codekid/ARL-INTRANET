import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Public routes wrapped with maintenance mode check
  layout("routes/_public.tsx", [
    index("routes/home.tsx"),

    // Public news routes
    route("news", "routes/news._index.tsx"),
    route("news/:slug", "routes/news.$slug.tsx"),

    // Public directory routes
    route("directory", "routes/directory._index.tsx"),

    // Public apps routes
    route("apps", "routes/apps._index.tsx"),

    // Public toolbox talk routes (Phase 2)
    route("toolbox-talk", "routes/toolbox-talk._index.tsx"),
    route("toolbox-talk/:slug", "routes/toolbox-talk.$slug.tsx"),

    // Public alerts routes (Phase 2)
    route("alerts", "routes/alerts._index.tsx"),
    route("alerts/:id", "routes/alerts.$id.tsx"),

    // Public safety tips routes (Phase 2)
    route("safety-tips", "routes/safety-tips._index.tsx"),
    route("safety-tips/:slug", "routes/safety-tips.$slug.tsx"),

    // Public safety videos routes (Phase 2)
    route("safety-videos", "routes/safety-videos._index.tsx"),

    // Public safety hub route (Phase 2)
    route("safety", "routes/safety._index.tsx"),

    // Public events routes (Phase 3)
    route("events", "routes/events._index.tsx"),
    route("events/:slug", "routes/events.$slug.tsx"),

    // Public gallery routes (Phase 3)
    route("gallery", "routes/gallery._index.tsx"),
    route("gallery/:slug", "routes/gallery.$slug.tsx"),

    // Public canteen routes (Phase 2)
    route("canteen", "routes/canteen._index.tsx"),

    // Public suggestion box (Phase 3)
    route("suggestions", "routes/suggestions._index.tsx"),

    // Public gold news (Phase 4)
    route("gold-news", "routes/gold-news._index.tsx"),

    // Public policies routes
    route("policies", "routes/policies._index.tsx"),
    route("policies/:slug", "routes/policies.$slug.tsx"),

    // About page
    route("about", "routes/about.tsx"),
  ]),

  // User authentication routes
  route("login", "routes/user.login.tsx"),
  route("logout", "routes/user.logout.tsx"),

  // API routes (not affected by maintenance mode)
  route("api/quick-links", "routes/api.quick-links.tsx"),

  // User auth API routes
  route("api/user/auth", "routes/api.user.auth.ts"),
  route("api/user/me", "routes/api.user.me.ts"),
  route("api/toolbox-talk-weekly", "routes/api.toolbox-talk-weekly.tsx"),
  route("api/upload", "routes/api.upload.tsx"),
  route("api/csv-template", "routes/api.csv-template.tsx"),
  route("api/alerts", "routes/api.alerts.tsx"),
  route("api/menu", "routes/api.menu.tsx"),
  route("api/safety-categories", "routes/api.safety-categories.tsx"),
  route("api/safety-tips", "routes/api.safety-tips.tsx"),
  route("api/safety-videos", "routes/api.safety-videos.tsx"),
  route("api/events", "routes/api.events.tsx"),
  route("api/albums", "routes/api.albums.ts"),
  route("api/suggestions", "routes/api.suggestions.tsx"),
  route("api/suggestions/categories", "routes/api.suggestions.categories.tsx"),
  // route("api/chat", "routes/api.chat.tsx"), // Commented out - AI chatbot disabled for now
  route("api/gold-news", "routes/api.gold-news.tsx"),
  route("api/featured-news", "routes/api.featured-news.tsx"),

  // Admin routes
  layout("routes/admin.tsx", [
    route("admin", "routes/admin._index.tsx"),
    route("admin/login", "routes/admin.login.tsx"),
    route("admin/logout", "routes/admin.logout.tsx"),
    route("admin/users", "routes/admin.users.tsx"),
    route("admin/activity", "routes/admin.activity.tsx"),

    // Admin portal users routes (employee management)
    route("admin/portal-users", "routes/admin.portal-users.tsx"),
    route("admin/portal-users/new", "routes/admin.portal-users.new.tsx"),
    route("admin/portal-users/:id/edit", "routes/admin.portal-users.$id.edit.tsx"),

    // Admin news routes
    route("admin/news", "routes/admin.news._index.tsx"),
    route("admin/news/new", "routes/admin.news.new.tsx"),
    route("admin/news/categories", "routes/admin.news.categories.tsx"),
    route("admin/news/:id/edit", "routes/admin.news.$id.edit.tsx"),

    // Admin directory routes
    route("admin/directory", "routes/admin.directory.tsx"),
    route("admin/departments", "routes/admin.departments.tsx"),

    // Admin apps routes
    route("admin/apps", "routes/admin.apps.tsx"),
    route("admin/apps/categories", "routes/admin.apps.categories.tsx"),

    // Admin toolbox talk routes (Phase 2)
    route("admin/toolbox-talks", "routes/admin.toolbox-talks._index.tsx"),
    route("admin/toolbox-talks/new", "routes/admin.toolbox-talks.new.tsx"),
    route("admin/toolbox-talks/:id/edit", "routes/admin.toolbox-talks.$id.edit.tsx"),

    // Admin alerts routes (Phase 2)
    route("admin/alerts", "routes/admin.alerts._index.tsx"),
    route("admin/alerts/new", "routes/admin.alerts.new.tsx"),
    route("admin/alerts/:id/edit", "routes/admin.alerts.$id.edit.tsx"),

    // Admin safety tips routes (Phase 2)
    route("admin/safety-tips", "routes/admin.safety-tips._index.tsx"),
    route("admin/safety-tips/new", "routes/admin.safety-tips.new.tsx"),

    // Admin safety videos routes (Phase 2)
    route("admin/safety-videos", "routes/admin.safety-videos._index.tsx"),
    route("admin/safety-videos/new", "routes/admin.safety-videos.new.tsx"),
    route("admin/safety-videos/:id/edit", "routes/admin.safety-videos.$id.edit.tsx"),

    // Admin safety tips edit route (Phase 2)
    route("admin/safety-tips/:id/edit", "routes/admin.safety-tips.$id.edit.tsx"),

    // Admin safety categories route (Phase 2)
    route("admin/safety-categories", "routes/admin.safety-categories._index.tsx"),

    // Admin menus routes (Phase 2)
    route("admin/menus", "routes/admin.menus._index.tsx"),
    route("admin/menus/new", "routes/admin.menus.new.tsx"),
    route("admin/menus/templates", "routes/admin.menus.templates.tsx"),
    route("admin/menus/:id/edit", "routes/admin.menus.$id.edit.tsx"),

    // Admin events routes (Phase 3)
    route("admin/events", "routes/admin.events._index.tsx"),
    route("admin/events/new", "routes/admin.events.new.tsx"),
    route("admin/events/:id/edit", "routes/admin.events.$id.edit.tsx"),

    // Admin gallery routes (Phase 3)
    route("admin/gallery", "routes/admin.gallery._index.tsx"),
    route("admin/gallery/new", "routes/admin.gallery.new.tsx"),
    route("admin/gallery/:id/edit", "routes/admin.gallery.$id.edit.tsx"),
    route("admin/gallery/:id/photos", "routes/admin.gallery.$id.photos.tsx"),

    // Admin suggestions routes (Phase 3)
    route("admin/suggestions", "routes/admin.suggestions._index.tsx"),
    route("admin/suggestions/categories", "routes/admin.suggestions.categories.tsx"),

    // Admin chatbot routes (Phase 4) - Commented out, AI chatbot disabled for now
    // route("admin/faqs", "routes/admin.faqs._index.tsx"),

    // Admin IT tips route
    route("admin/it-tips", "routes/admin.it-tips.tsx"),

    // Admin executive messages route
    route("admin/executive-messages", "routes/admin.executive-messages.tsx"),

    // Admin policies routes
    route("admin/policies", "routes/admin.policies._index.tsx"),
    route("admin/policies/new", "routes/admin.policies.new.tsx"),
    route("admin/policies/categories", "routes/admin.policies.categories.tsx"),
    route("admin/policies/:id/edit", "routes/admin.policies.$id.edit.tsx"),

    // Admin settings route (Superadmin only)
    route("admin/settings", "routes/admin.settings.tsx"),
  ]),
] satisfies RouteConfig;
