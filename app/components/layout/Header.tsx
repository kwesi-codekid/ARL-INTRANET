import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Input,
  Avatar,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Badge,
  Chip,
} from "@heroui/react";
import {
  Search,
  Bell,
  LogOut,
  User,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Shield,
  Phone,
  UtensilsCrossed,
  Lightbulb,
  Video,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { useAlertsSafe } from "~/components/alerts";
import { GoldPriceTicker } from "~/components/ui";
import type { PortalUser } from "./MainLayout";

interface HeaderProps {
  user?: PortalUser | null;
}

const navItems = [
  { label: "Home", href: "/" },
  { label: "Policies", href: "/policies" },
  { label: "News", href: "/news" },
  { label: "Safety", href: "/safety" },
  { label: "Directory", href: "/directory" },
  { label: "Events", href: "/events" },
  { label: "Apps", href: "/apps" },
  { label: "Suggestions", href: "/suggestions" },
];

const severityIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const severityColors = {
  critical: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get alerts from context - returns null if AlertProvider not mounted
  const alertContext = useAlertsSafe();

  // Extract values safely
  const alertCount = alertContext?.alertCount ?? 0;
  const alerts = alertContext?.popupAlerts.slice(0, 5).map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    severity: a.severity,
    type: a.type,
  })) ?? [];
  const openPopup = alertContext?.openPopup ?? null;

  return (
    <div className="sticky top-0 z-50">
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        classNames={{
          base: "bg-[#1a1a1a] shadow-md",
          wrapper: "max-w-full px-4 sm:px-6",
        }}
        maxWidth="full"
        height="4.5rem"
        isBlurred={false}
      >
      {/* Mobile menu toggle */}
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="text-white"
        />
      </NavbarContent>

      {/* Brand */}
      <NavbarContent justify="start" className="gap-8">
        <NavbarBrand>
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Adamus Resources"
              className="h-12 sm:h-14 w-auto object-contain"
              style={{ maxWidth: '200px' }}
            />
          </Link>
        </NavbarBrand>

        {/* Desktop nav items */}
        <div className="hidden gap-1 sm:flex">
          {navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NavLink
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      {/* Search & Actions */}
      <NavbarContent justify="end" className="gap-2 sm:gap-3">
        {/* Gold Price Ticker - beside search */}
        <NavbarItem className="hidden lg:block">
          <div className="flex items-center h-[46px]">
            <GoldPriceTicker />
          </div>
        </NavbarItem>

        {/* Search */}
        <NavbarItem className="hidden md:flex">
          <Input
            classNames={{
              base: "max-w-[200px]",
              inputWrapper: "bg-white/20 hover:bg-white/30 group-data-[focus=true]:bg-white/30 border-0",
              input: "text-white placeholder:text-white/60 text-sm",
            }}
            placeholder="Search..."
            size="sm"
            startContent={<Search size={16} className="text-white/60" />}
            type="search"
          />
        </NavbarItem>

        {/* Notifications/Alerts - hidden on mobile */}
        <NavbarItem className="hidden sm:flex">
          <Popover placement="bottom-end" showArrow>
            <PopoverTrigger>
              <Button
                isIconOnly
                variant="light"
                aria-label="Alerts"
                className="text-white hover:bg-white/20"
                size="sm"
              >
                <Badge
                  content={alertCount > 0 ? alertCount : undefined}
                  color="danger"
                  size="sm"
                  isInvisible={alertCount === 0}
                >
                  <Bell size={20} />
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Alerts</h3>
                  {alertCount > 0 && (
                    <Chip size="sm" color="danger" variant="flat">
                      {alertCount} active
                    </Chip>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {alerts.map((alert) => {
                      const Icon = severityIcons[alert.severity];
                      return (
                        <Link
                          key={alert.id}
                          to={`/alerts/${alert.id}`}
                          className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className={`mt-0.5 ${severityColors[alert.severity]}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {alert.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {alert.message}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active alerts</p>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                  {openPopup && alertCount > 0 && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="warning"
                      className="flex-1"
                      onPress={openPopup}
                    >
                      View Popup
                    </Button>
                  )}
                  <Button
                    as={Link}
                    to="/alerts"
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="flex-1"
                    endContent={<ChevronRight size={14} />}
                  >
                    View All Alerts
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </NavbarItem>

        {/* User Menu */}
        <NavbarItem>
          {user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button variant="light" className="gap-2 px-2">
                  <Avatar
                    name={getUserInitials(user.name)}
                    size="sm"
                    classNames={{
                      base: "bg-white text-primary-600 font-semibold cursor-pointer",
                    }}
                  />
                  <span className="hidden sm:inline text-white text-sm font-medium max-w-[120px] truncate">
                    {user.name}
                  </span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem
                  key="user-info"
                  isReadOnly
                  className="cursor-default opacity-100"
                  textValue={user.name}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{user.name}</span>
                    {user.position && (
                      <span className="text-xs text-gray-500">{user.position}</span>
                    )}
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<LogOut size={16} />}
                  href="/logout"
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Link to="/login">
              <Avatar
                icon={<User size={18} />}
                size="sm"
                classNames={{
                  base: "bg-white/20 text-white cursor-pointer hover:bg-white/30 transition-colors",
                }}
              />
            </Link>
          )}
        </NavbarItem>
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu className="bg-[#1a1a1a] pt-6 pb-24">
        {/* Mobile Search */}
        <div className="mb-4 px-2">
          <Input
            classNames={{
              inputWrapper: "bg-white/20 border-0",
              input: "text-white placeholder:text-white/60",
            }}
            placeholder="Search..."
            size="sm"
            startContent={<Search size={16} className="text-white/60" />}
            type="search"
          />
        </div>

        {/* Main Navigation */}
        {navItems.map((item) => (
          <NavbarMenuItem key={item.href}>
            <NavLink
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                `block w-full rounded-lg px-3 py-2 text-lg ${
                  isActive
                    ? "bg-white/20 font-semibold text-white"
                    : "text-white/80"
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          </NavbarMenuItem>
        ))}

        {/* Quick Access Section */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/50">
            Quick Access
          </p>
          <NavbarMenuItem>
            <Link
              to="/toolbox-talk"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <Shield size={18} className="text-green-400" />
              <span>Weekly Toolbox Talk</span>
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              to="/safety-tips"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <Lightbulb size={18} className="text-emerald-400" />
              <span>Safety Tips</span>
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              to="/safety-videos"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <Video size={18} className="text-blue-400" />
              <span>Safety Videos</span>
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              to="/canteen"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <UtensilsCrossed size={18} className="text-orange-400" />
              <span>Today's Menu</span>
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              to="/events"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <Calendar size={18} className="text-purple-400" />
              <span>Upcoming Events</span>
            </Link>
          </NavbarMenuItem>
        </div>

        <NavbarMenuItem>
          <Link
            to="/admin"
            className="mt-4 block w-full rounded-lg px-3 py-2 text-lg text-white/60"
            onClick={() => setIsMenuOpen(false)}
          >
            Admin Portal
          </Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
    </div>
  );
}
