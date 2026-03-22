/**
 * API Route: Suggestion Categories
 * GET /api/suggestions/categories - Get all active categories
 */

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getActiveCategories } = await import("~/lib/services/suggestion.server");

  await connectDB();

  const categories = await getActiveCategories();

  return Response.json({
    categories: categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    })),
  });
}
