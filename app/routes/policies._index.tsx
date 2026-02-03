/**
 * Public Policies Listing Page
 * Browse company policies by category
 */

import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Pagination,
} from "@heroui/react";
import { Search, FileText, Download, Calendar, Eye } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, Link } from "react-router";
import { MainLayout } from "~/components/layout";
import { CompanyValuesSlideshow } from "~/components/dashboard";
import type { CompanyImages } from "~/components/dashboard";
import { connectDB } from "~/lib/db/connection.server";
import { getCompanyImages } from "~/lib/services/company-info.server";
import {
  getPublishedPolicies,
  getPolicyCategories,
  serializePolicy,
  serializePolicyCategory,
} from "~/lib/services/policy.server";

const ITEMS_PER_PAGE = 9;

export async function loader({ request }: LoaderFunctionArgs) {
  await connectDB();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const category = url.searchParams.get("category") || "";
  const search = url.searchParams.get("search") || "";

  const options: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
  } = {
    page,
    limit: ITEMS_PER_PAGE,
  };

  if (category) {
    options.category = category;
  }

  if (search) {
    options.search = search;
  }

  const [{ policies, total }, categories, companyImages] = await Promise.all([
    getPublishedPolicies(options),
    getPolicyCategories({ activeOnly: true }),
    getCompanyImages(),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return Response.json({
    policies: policies.map(serializePolicy),
    categories: categories.map(serializePolicyCategory),
    pagination: { page, totalPages, totalCount: total },
    currentCategory: category,
    searchQuery: search,
    companyImages,
  });
}

export default function PoliciesPage() {
  const { policies, categories, pagination, currentCategory, searchQuery, companyImages } =
    useLoaderData<typeof loader>() as {
      policies: ReturnType<typeof serializePolicy>[];
      categories: ReturnType<typeof serializePolicyCategory>[];
      pagination: { page: number; totalPages: number; totalCount: number };
      currentCategory: string;
      searchQuery: string;
      companyImages: CompanyImages;
    };
  const [searchParams, setSearchParams] = useSearchParams();

  const handleCategoryFilter = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Company Values Slideshow - Mission, Vision, Values */}
        <CompanyValuesSlideshow images={companyImages} className="mb-8" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Policies</h1>
          <p className="mt-2 text-gray-600">
            Access and download official company policies and guidelines
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search policies..."
            defaultValue={searchQuery}
            onValueChange={handleSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            className="max-w-md"
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Chip
              variant={!currentCategory ? "solid" : "flat"}
              color={!currentCategory ? "primary" : "default"}
              className="cursor-pointer"
              onClick={() => handleCategoryFilter("")}
            >
              All Policies
            </Chip>
            {categories.map((cat) => (
              <Chip
                key={cat._id}
                variant={currentCategory === cat._id ? "solid" : "flat"}
                color={currentCategory === cat._id ? "primary" : "default"}
                className="cursor-pointer"
                onClick={() => handleCategoryFilter(cat._id)}
              >
                {cat.name}
              </Chip>
            ))}
          </div>
        )}

        {/* Policies Grid */}
        {policies.length === 0 ? (
          <Card className="py-12">
            <CardBody className="text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">
                No policies found
              </h3>
              <p className="mt-2 text-gray-500">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No policies have been published yet"}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {policies.map((policy) => (
              <Link key={policy._id} to={`/policies/${policy.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader className="flex-col items-start gap-2 pb-0">
                    <div className="flex w-full items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                        <FileText size={24} className="text-primary-600" />
                      </div>
                      {policy.pdfUrl && (
                        <Chip size="sm" variant="flat" color="success">
                          <Download size={12} className="mr-1" />
                          PDF
                        </Chip>
                      )}
                    </div>
                    {typeof policy.category === "object" && policy.category && (
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${policy.category.color}20`,
                          color: policy.category.color,
                        }}
                      >
                        {policy.category.name}
                      </Chip>
                    )}
                  </CardHeader>
                  <CardBody>
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
                      {policy.title}
                    </h3>
                    {policy.excerpt && (
                      <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                        {policy.excerpt}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {policy.version && <span>v{policy.version}</span>}
                      {policy.effectiveDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(policy.effectiveDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {policy.views}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              total={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              showControls
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
