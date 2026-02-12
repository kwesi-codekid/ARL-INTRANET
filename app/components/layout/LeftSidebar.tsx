import { Avatar, Card, CardBody, Button } from "@heroui/react";
import {
  Home,
  Newspaper,
  Shield,
  Users,
  Calendar,
  AppWindow,
  Images,
  Utensils,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

const menuItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Safety", href: "/safety", icon: Shield },
  { label: "Directory", href: "/directory", icon: Users },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Gallery", href: "/gallery", icon: Images },
  { label: "Apps", href: "/apps", icon: AppWindow },
];

const quickAccess = [
  { label: "Canteen Menu", href: "/canteen", icon: Utensils },
  { label: "Suggestions", href: "/suggestions", icon: MessageSquare },
  { label: "Help & Support", href: "/help", icon: HelpCircle },
];

export function LeftSidebar() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <aside className="sticky top-20 hidden w-64 shrink-0 self-start max-h-[calc(100vh-6rem)] overflow-y-auto lg:block">
      {/* User Card */}
      <Card className="mb-4 shadow-sm">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              name="PK"
              size="lg"
              classNames={{
                base: "bg-primary-500 text-white font-semibold",
              }}
            />
            <div>
              <p className="text-sm text-gray-500">{getGreeting()},</p>
              <p className="font-semibold text-gray-900">Patrick</p>
              <p className="text-xs text-gray-500">IT Department</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Pages Section */}
      <Card className="mb-4 shadow-sm">
        <CardBody className="p-2">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pages
            </span>
            <Link to="/" className="text-xs text-primary-500 hover:underline">
              View all
            </Link>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-primary-50 font-medium text-primary-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon
                  size={18}
                  className={isActive(item.href) ? "text-primary-500" : "text-gray-400"}
                />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Show More */}
          <Button
            variant="light"
            size="sm"
            className="mt-2 w-full justify-start text-gray-500"
            onPress={() => setShowMore(!showMore)}
            startContent={showMore ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          >
            {showMore ? "Show less" : "Show more"}
          </Button>

          {showMore && (
            <nav className="mt-2 space-y-1">
              {quickAccess.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <item.icon size={18} className="text-gray-400" />
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </CardBody>
      </Card>

      {/* Safety Quick Access */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Shield size={28} className="text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Safety First</p>
            <p className="text-sm text-gray-500">Access safety resources</p>
            <Link
              to="/safety"
              className="mt-3 inline-block rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
            >
              Safety Center
            </Link>
          </div>
        </CardBody>
      </Card>
    </aside>
  );
}
