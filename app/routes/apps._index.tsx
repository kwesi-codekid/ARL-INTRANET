import type { AppLinksGroupedByCategory } from "~/lib/services/app-link.server";

/**
 * Company Apps Listing
 * Task: 1.1.5.2.1
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useOutletContext } from "react-router";
import type { PublicOutletContext } from "~/routes/_public";
import {
  Card,
  CardBody,
  Input,
  Chip,
} from "@heroui/react";
import {
  Search,
  ExternalLink,
  Lock,
  AppWindow,
  Folder,
  LayoutGrid,
  FileText,
  Mail,
  Calendar,
  Database,
  Users,
  Settings,
  Shield,
  BarChart,
  Truck,
  Wrench,
  Globe,
  // Additional common business icons
  Briefcase,
  Building,
  Building2,
  Calculator,
  Clock,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  HardDrive,
  Headphones,
  Heart,
  Home,
  Landmark,
  Laptop,
  LineChart,
  MapPin,
  MessageSquare,
  Monitor,
  Package,
  Phone,
  Printer,
  Server,
  ShoppingCart,
  Smartphone,
  Target,
  Video,
  Wallet,
  Wifi,
  Zap,
  ClipboardList,
  Factory,
  Fuel,
  HardHat,
  Pickaxe,
  Receipt,
  Scale,
  Warehouse,
  // Health & Medical (for Med Treatment app)
  HeartPulse,
  Activity,
  Stethoscope,
  Pill,
  Syringe,
  Cross,
  CirclePlus,
  Ambulance,
  // Safety & HSE (for HSE Suite)
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Siren,
  BadgeCheck,
  ClipboardCheck,
  FileCheck,
  FileWarning,
  // Additional utility
  Eye,
  Megaphone,
  Bell,
  BookOpen,
  GraduationCap,
  Layers,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { MainLayout } from "~/components/layout";


import type { IAppLink, IAppLinkCategory } from "~/lib/db/models/app-link.server";

// Icon mapping for lucide icons
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // Original icons
  AppWindow,
  Folder,
  LayoutGrid,
  FileText,
  Mail,
  Calendar,
  Database,
  Users,
  Settings,
  Shield,
  BarChart,
  Truck,
  Wrench,
  Globe,
  ExternalLink,
  Lock,
  // Business & Finance
  Briefcase,
  Building,
  Building2,
  Calculator,
  CreditCard,
  DollarSign,
  Landmark,
  Receipt,
  Scale,
  Wallet,
  // Time & Productivity
  Clock,
  ClipboardList,
  Target,
  // Technology & IT
  HardDrive,
  Laptop,
  Monitor,
  Server,
  Smartphone,
  Wifi,
  Zap,
  // Communication
  Headphones,
  MessageSquare,
  Phone,
  Video,
  // Charts & Data
  FileSpreadsheet,
  LineChart,
  // Logistics & Operations
  Factory,
  Home,
  MapPin,
  Package,
  Printer,
  ShoppingCart,
  Warehouse,
  // Mining & Industry specific
  Fuel,
  HardHat,
  Pickaxe,
  // Health & Medical (Med Treatment)
  Heart,
  HeartPulse,
  Activity,
  Stethoscope,
  Pill,
  Syringe,
  Cross,
  CirclePlus,
  Ambulance,
  // Safety & HSE (HSE Suite)
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Siren,
  BadgeCheck,
  ClipboardCheck,
  FileCheck,
  FileWarning,
  // Additional utility
  Eye,
  Megaphone,
  Bell,
  BookOpen,
  GraduationCap,
  Layers,
  PieChart,
  TrendingUp,
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { getAppLinksGroupedByCategory, searchAppLinks, incrementClicks } = await import("~/lib/services/app-link.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  let data;
  if (search) {
    const results = await searchAppLinks(search, 50);
    data = { searchResults: JSON.parse(JSON.stringify(results)), grouped: null, search };
  } else {
    const grouped = await getAppLinksGroupedByCategory();
    data = { grouped: JSON.parse(JSON.stringify(grouped)), searchResults: null, search };
  }

  return Response.json(data);
}

export async function action({ request }: ActionFunctionArgs) {
  const { getAppLinksGroupedByCategory, searchAppLinks, incrementClicks } = await import("~/lib/services/app-link.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "click") {
    const linkId = formData.get("linkId") as string;
    if (linkId) {
      await incrementClicks(linkId);
    }
  }

  return Response.json({ success: true });
}

function AppIcon({ icon, iconType, className }: { icon?: string; iconType: string; className?: string }) {
  if (!icon) {
    return <AppWindow size={24} className={className} />;
  }

  if (iconType === "emoji") {
    return <span className="text-2xl">{icon}</span>;
  }

  if (iconType === "url") {
    return <img src={icon} alt="" className="h-6 w-6 object-contain" />;
  }

  // lucide icon
  const IconComponent = iconMap[icon] || AppWindow;
  return <IconComponent size={24} className={className} />;
}

function CategoryIcon({ icon }: { icon?: string }) {
  if (!icon) {
    return <Folder size={20} className="text-primary-500" />;
  }

  const IconComponent = iconMap[icon] || Folder;
  return <IconComponent size={20} className="text-primary-500" />;
}

export default function AppsPage() {
  const { grouped, searchResults, search } = useLoaderData<typeof loader>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const fetcher = useFetcher();
  const [searchValue, setSearchValue] = useState(search);

  const handleLinkClick = (link: IAppLink) => {
    // Track click
    fetcher.submit({ intent: "click", linkId: link._id.toString() }, { method: "post" });

    // Open link
    window.open(link.url, link.isInternal ? "_self" : "_blank", "noopener,noreferrer");
  };

  const hasResults = searchResults ? searchResults.length > 0 : grouped && grouped.length > 0;

  return (
    <MainLayout user={portalUser}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Apps</h1>
          <p className="mt-2 text-gray-600">
            Quick access to business applications and tools
          </p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardBody>
            <form method="get">
              <Input
                name="search"
                placeholder="Search applications..."
                startContent={<Search size={18} className="text-gray-400" />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="max-w-xl"
                classNames={{ inputWrapper: "bg-gray-50" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.form?.submit();
                  }
                }}
              />
            </form>
          </CardBody>
        </Card>

        {/* Results */}
        {!hasResults ? (
          <Card>
            <CardBody className="py-12 text-center">
              <AppWindow size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">
                {search ? "No applications found" : "No applications available"}
              </h3>
              <p className="mt-1 text-gray-500">
                {search
                  ? "Try searching with different keywords"
                  : "Check back later for application links"}
              </p>
            </CardBody>
          </Card>
        ) : searchResults ? (
          // Search Results
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Found {searchResults.length} application{searchResults.length !== 1 ? "s" : ""} for "{search}"
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((link: IAppLink) => (
                <AppLinkCard
                  key={link._id.toString()}
                  link={link}
                  onClick={() => handleLinkClick(link)}
                />
              ))}
            </div>
          </div>
        ) : (
          // Grouped by Category
          <div className="space-y-8">
            {grouped?.map((group: AppLinksGroupedByCategory) => (
              <section key={group.category._id.toString()}>
                <div className="mb-4 flex items-center gap-2">
                  <CategoryIcon icon={group.category.icon} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {group.category.name}
                  </h2>
                  <Chip size="sm" variant="flat" className="ml-2">
                    {group.links.length}
                  </Chip>
                </div>
                {group.category.description && (
                  <p className="mb-4 text-sm text-gray-600">
                    {group.category.description}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.links.map((link: IAppLink) => (
                    <AppLinkCard
                      key={link._id.toString()}
                      link={link}
                      onClick={() => handleLinkClick(link)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function AppLinkCard({ link, onClick }: { link: IAppLink; onClick: () => void }) {
  return (
    <Card
      isPressable
      onPress={onClick}
      className="group hover:shadow-md transition-shadow"
    >
      <CardBody className="gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
            <AppIcon
              icon={link.icon}
              iconType={link.iconType}
              className="text-primary-600"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-gray-900">
                {link.name}
              </h3>
              {link.isInternal ? (
                <Lock size={12} className="shrink-0 text-gray-400" />
              ) : (
                <ExternalLink size={12} className="shrink-0 text-gray-400" />
              )}
            </div>
            {link.description && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {link.description}
              </p>
            )}
          </div>
        </div>
        {link.category && typeof link.category === "object" && (
          <div className="flex items-center justify-between">
            <Chip size="sm" variant="flat" className="text-xs">
              {(link.category as IAppLinkCategory).name}
            </Chip>
            {link.clicks > 0 && (
              <span className="text-xs text-gray-400">
                {link.clicks} click{link.clicks !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
