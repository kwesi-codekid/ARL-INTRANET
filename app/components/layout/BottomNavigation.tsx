import { Home, Shield, Users, Images, AppWindow } from "lucide-react";
import { NavLink } from "react-router";

const navItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Safety", to: "/safety", icon: Shield },
  { label: "Directory", to: "/directory", icon: Users },
  { label: "Gallery", to: "/gallery", icon: Images },
  { label: "Apps", to: "/apps", icon: AppWindow },
];

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                isActive
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={22}
                  className={isActive ? "text-primary-500" : ""}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
