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
} from "@heroui/react";
import {
  Search,
  ExternalLink,
  Lock,
  AppWindow,
} from "lucide-react";
import { useState } from "react";
import { MainLayout } from "~/components/layout";
import { AppIcon } from "~/components/ui";

import type { IAppLink } from "~/lib/db/models/app-link.server";

interface LoaderData {
  appLinks: IAppLink[];
  search: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { getAllActiveAppLinks, searchAppLinks } = await import("~/lib/services/app-link.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  let appLinks: IAppLink[];
  if (search) {
    appLinks = await searchAppLinks(search, 50);
  } else {
    appLinks = await getAllActiveAppLinks();
  }

  return Response.json({
    appLinks: JSON.parse(JSON.stringify(appLinks)),
    search,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { incrementClicks } = await import("~/lib/services/app-link.server");
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

export default function AppsPage() {
  const { appLinks, search } = useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const fetcher = useFetcher();
  const [searchValue, setSearchValue] = useState(search);

  const handleLinkClick = (link: IAppLink) => {
    // Track click
    fetcher.submit({ intent: "click", linkId: link._id.toString() }, { method: "post" });

    // Open link
    window.open(link.url, link.isInternal ? "_self" : "_blank", "noopener,noreferrer");
  };

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
        {appLinks.length === 0 ? (
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
        ) : (
          <div>
            {search && (
              <p className="mb-4 text-sm text-gray-600">
                Found {appLinks.length} application{appLinks.length !== 1 ? "s" : ""} for &quot;{search}&quot;
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {appLinks.map((link: IAppLink) => (
                <AppLinkCard
                  key={link._id.toString()}
                  link={link}
                  onClick={() => handleLinkClick(link)}
                />
              ))}
            </div>
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
        {link.clicks > 0 && (
          <div className="flex justify-end">
            <span className="text-xs text-gray-400">
              {link.clicks} click{link.clicks !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
