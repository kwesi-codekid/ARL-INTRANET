/**
 * Safety Tips Listing Page
 * Task: 1.2.2.2.1 - Create safety tips listing page
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Tabs,
  Tab,
  Pagination,
} from "@heroui/react";
import { Search, Shield, Eye, ArrowRight } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useOutletContext } from "react-router";
import { MainLayout } from "~/components/layout";
import type { PublicOutletContext } from "~/routes/_public";
import type { SerializedSafetyTip, SerializedSafetyCategory } from "~/lib/services/safety.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { getSafetyTips, getSafetyCategories, serializeSafetyTip, serializeSafetyCategory } = await import("~/lib/services/safety.server");
  const { connectDB } = await import("~/lib/db/connection.server");

  await connectDB();

  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const categories = await getSafetyCategories(true);
  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  const result = await getSafetyTips({
    category: selectedCategory?._id.toString(),
    search,
    page,
    limit: 12,
    status: "published",
  });

  return Response.json({
    tips: result.tips.map(serializeSafetyTip),
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    categories: categories.map(serializeSafetyCategory),
    selectedCategory: categorySlug || "all",
    searchQuery: search || "",
  });
}

interface LoaderData {
  tips: SerializedSafetyTip[];
  total: number;
  page: number;
  totalPages: number;
  categories: SerializedSafetyCategory[];
  selectedCategory: string;
  searchQuery: string;
}

export default function SafetyTipsPage() {
  const { tips, total, page, totalPages, categories, selectedCategory, searchQuery } =
    useLoaderData<LoaderData>();
  const { portalUser } = useOutletContext<PublicOutletContext>();
  const [search, setSearch] = useState(searchQuery);

  return (
    <MainLayout user={portalUser}>
      <div className="overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
            <Shield size={24} className="text-green-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Safety Tips</h1>
            <p className="text-gray-500 truncate">Stay safe with these important safety guidelines</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6 shadow-sm">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" className="flex-1 max-w-md">
            <Input
              placeholder="Search tips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              name="search"
              startContent={<Search size={18} className="text-gray-400" />}
              classNames={{
                inputWrapper: "bg-gray-50",
              }}
            />
            {selectedCategory !== "all" && (
              <input type="hidden" name="category" value={selectedCategory} />
            )}
          </form>
          <div className="text-sm text-gray-500">{total} tips available</div>
        </CardBody>
      </Card>

      {/* Category Tabs - Task: 1.2.2.2.3 */}
      <div className="mb-6 overflow-x-auto max-w-full">
        <Tabs
          selectedKey={selectedCategory}
          onSelectionChange={(key) => {
            const params = new URLSearchParams();
            if (key !== "all") params.set("category", key.toString());
            if (search) params.set("search", search);
            window.location.href = `/safety-tips?${params.toString()}`;
          }}
          variant="underlined"
          color="success"
          classNames={{
            tabList: "gap-4 flex-nowrap",
          }}
        >
          <Tab key="all" title="All Tips" />
          {categories.map((category) => (
            <Tab
              key={category.slug}
              title={
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* Tips Grid - Task: 1.2.2.2.2 */}
      {tips.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="py-12 text-center">
            <Shield size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No tips found</h3>
            <p className="text-gray-500">
              {search ? "Try adjusting your search" : "Check back later for safety tips"}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <Card
              key={tip.id}
              as={Link}
              to={`/safety-tips/${tip.slug}`}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              isPressable
            >
              {/* Image Section */}
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
                {tip.featuredImage ? (
                  <img
                    src={tip.featuredImage}
                    alt={tip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shield size={48} className="text-green-300" />
                  </div>
                )}
                {/* Category badge on image */}
                {tip.category && (
                  <div className="absolute top-2 left-2">
                    <Chip
                      size="sm"
                      variant="solid"
                      style={{ backgroundColor: tip.category.color }}
                      className="text-white"
                    >
                      {tip.category.name}
                    </Chip>
                  </div>
                )}
              </div>
              {/* Content Section - Solid Background */}
              <CardBody className="p-3 bg-white">
                <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{tip.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{tip.summary}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye size={12} />
                    <span>{tip.views} views</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    Read More <ArrowRight size={12} />
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination - Task: 1.2.2.2.1 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={(newPage) => {
              const params = new URLSearchParams();
              if (selectedCategory !== "all") params.set("category", selectedCategory);
              if (search) params.set("search", search);
              params.set("page", newPage.toString());
              window.location.href = `/safety-tips?${params.toString()}`;
            }}
            color="success"
          />
        </div>
      )}
      </div>
    </MainLayout>
  );
}
