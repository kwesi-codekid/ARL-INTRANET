/**
 * API Route: Suggestion Categories
 * GET /api/suggestions/categories - Get all active categories
 */

import type { LoaderFunctionArgs } from "react-router";
import { connectDB } from "~/lib/db/connection.server";
import { getActiveCategories } from "~/lib/services/suggestion.server";

export async function loader({ request }: LoaderFunctionArgs) {
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
