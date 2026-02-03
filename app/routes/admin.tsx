/**
 * Admin Layout
 * Task: 1.1.2.3.1
 */

import { Outlet, useLoaderData, useLocation, Link, Form } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import {
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  AppWindow,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCog,
  Activity,
  BookUser,
  Building2,
  HardHat,
  AlertTriangle,
  Calendar,
  Image,
  Lightbulb,
  Video,
  UtensilsCrossed,
  MessageSquare,
  Bot,
  HelpCircle,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { requireAuth, getSessionData } from "~/lib/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if this is the login page
  const url = new URL(request.url);
  if (url.pathname === "/admin/login") {
    return Response.json({ user: null });
  }

  // Require authentication for all other admin routes
  await requireAuth(request);
  const sessionData = await getSessionData(request);

  return Response.json({ user: sessionData });
}

const sidebarItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Policies", href: "/admin/policies", icon: FileText },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Gallery", href: "/admin/gallery", icon: Image },
  { label: "Directory", href: "/admin/directory", icon: BookUser },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "App Links", href: "/admin/apps", icon: AppWindow },
  { label: "Menus", href: "/admin/menus", icon: UtensilsCrossed },
  { label: "Suggestions", href: "/admin/suggestions", icon: MessageSquare },
  { label: "Chatbot FAQs", href: "/admin/faqs", icon: Bot },
  { label: "IT Tips", href: "/admin/it-tips", icon: Lightbulb },
  { label: "Executive Messages", href: "/admin/executive-messages", icon: Users },
];

const safetyItems = [
  { label: "Alerts", href: "/admin/alerts", icon: AlertTriangle },
  { label: "Toolbox Talks", href: "/admin/toolbox-talks", icon: HardHat },
  { label: "Safety Tips", href: "/admin/safety-tips", icon: Lightbulb },
  { label: "Safety Videos", href: "/admin/safety-videos", icon: Video },
  { label: "Safety Categories", href: "/admin/safety-categories", icon: Shield },
];

const superadminItems = [
  { label: "Admin Users", href: "/admin/users", icon: UserCog },
  { label: "Activity Log", href: "/admin/activity", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't render layout for login page
  if (location.pathname === "/admin/login") {
    return <Outlet />;
  }

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <img
              src="/images/logo-icon.png"
              alt="ARL"
              className="h-10 w-10 object-contain"
            />
            <span className="font-bold text-gray-900">Admin</span>
          </Link>
          <Button
            isIconOnly
            variant="light"
            className="lg:hidden"
            onPress={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon
                  size={20}
                  className={isActive(item.href) ? "text-primary-500" : "text-gray-400"}
                />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Safety Section */}
          <div className="my-4 border-t" />
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Safety
          </p>
          <div className="space-y-1">
            {safetyItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon
                  size={20}
                  className={isActive(item.href) ? "text-primary-500" : "text-gray-400"}
                />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Superadmin Section */}
          {user?.role === "superadmin" && (
            <>
              <div className="my-4 border-t" />
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Superadmin
              </p>
              <div className="space-y-1">
                {superadminItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon
                      size={20}
                      className={isActive(item.href) ? "text-primary-500" : "text-gray-400"}
                    />
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={user?.name?.charAt(0) || "A"}
              size="sm"
              classNames={{
                base: "bg-primary-100 text-primary-700 font-semibold",
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          <Button
            isIconOnly
            variant="light"
            className="lg:hidden"
            onPress={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">
              {sidebarItems.find((item) => isActive(item.href))?.label ||
                superadminItems.find((item) => isActive(item.href))?.label ||
                "Admin"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-primary-500"
            >
              View Site
            </Link>

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button variant="light" className="gap-2">
                  <Avatar
                    name={user?.name?.charAt(0) || "A"}
                    size="sm"
                    classNames={{
                      base: "bg-primary-100 text-primary-700 font-semibold",
                    }}
                  />
                  <span className="hidden text-sm font-medium sm:inline">
                    {user?.name}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<LogOut size={16} />}
                  href="/admin/logout"
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
