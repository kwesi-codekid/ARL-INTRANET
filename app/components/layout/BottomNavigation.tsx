import { Home, Shield, Users, UtensilsCrossed, AppWindow } from "lucide-react";
import { Link, useLocation } from "react-router";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Safety", href: "/safety", icon: Shield },
  { label: "Directory", href: "/directory", icon: Users },
  { label: "Menu", href: "/canteen", icon: UtensilsCrossed },
  { label: "Apps", href: "/apps", icon: AppWindow },
];

export function BottomNavigation() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                active
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon
                size={22}
                className={active ? "text-primary-500" : ""}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
