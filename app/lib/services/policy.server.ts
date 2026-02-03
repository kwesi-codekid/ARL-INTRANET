import { connectDB } from "~/lib/db/connection.server";
import { Policy, PolicyCategory } from "~/lib/db/models/policy.server";
import type { IPolicy, IPolicyCategory } from "~/lib/db/models/policy.server";

// ============ POLICY CATEGORY FUNCTIONS ============

export interface PolicyCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

async function ensureUniqueCategorySlug(
  slug: string,
  excludeId?: string
): Promise<string> {
  await connectDB();
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: uniqueSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await PolicyCategory.findOne(query);
    if (!existing) break;
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

export async function createPolicyCategory(
  data: PolicyCategoryInput
): Promise<IPolicyCategory> {
  await connectDB();

  const slug = await ensureUniqueCategorySlug(
    data.slug || generateSlug(data.name)
  );

  // Get max order
  const maxOrder = await PolicyCategory.findOne()
    .sort({ order: -1 })
    .select("order")
    .lean();

  const category = new PolicyCategory({
    name: data.name,
    slug,
    description: data.description,
    icon: data.icon,
    color: data.color || "#d2ab67",
    order: data.order ?? (maxOrder?.order ?? 0) + 1,
    isActive: data.isActive ?? true,
  });

  return category.save();
}

export async function getPolicyCategories(options?: {
  activeOnly?: boolean;
}): Promise<IPolicyCategory[]> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (options?.activeOnly) {
    query.isActive = true;
  }

  return PolicyCategory.find(query).sort({ order: 1 }).lean();
}

export async function getPolicyCategoryById(
  id: string
): Promise<IPolicyCategory | null> {
  await connectDB();
  return PolicyCategory.findById(id).lean();
}

export async function getPolicyCategoryBySlug(
  slug: string
): Promise<IPolicyCategory | null> {
  await connectDB();
  return PolicyCategory.findOne({ slug }).lean();
}

export async function updatePolicyCategory(
  id: string,
  data: Partial<PolicyCategoryInput>
): Promise<IPolicyCategory | null> {
  await connectDB();

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    if (!data.slug) {
      updateData.slug = await ensureUniqueCategorySlug(
        generateSlug(data.name),
        id
      );
    }
  }

  if (data.slug !== undefined) {
    updateData.slug = await ensureUniqueCategorySlug(data.slug, id);
  }

  if (data.description !== undefined) updateData.description = data.description;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return PolicyCategory.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

export async function deletePolicyCategory(id: string): Promise<boolean> {
  await connectDB();

  // Check if category has policies
  const policyCount = await Policy.countDocuments({ category: id });
  if (policyCount > 0) {
    throw new Error(
      `Cannot delete category with ${policyCount} policies. Please reassign or delete them first.`
    );
  }

  const result = await PolicyCategory.findByIdAndDelete(id);
  return !!result;
}

export async function reorderPolicyCategories(
  orderedIds: string[]
): Promise<void> {
  await connectDB();

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }));

  await PolicyCategory.bulkWrite(bulkOps);
}

// ============ POLICY FUNCTIONS ============

export interface PolicyInput {
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  category: string;
  pdfUrl?: string;
  pdfFileName?: string;
  effectiveDate?: string;
  version?: string;
  status?: "draft" | "published" | "archived";
  isFeatured?: boolean;
  createdBy: string;
}

export interface GetPoliciesOptions {
  status?: "draft" | "published" | "archived";
  category?: string;
  search?: string;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
}

async function ensureUniquePolicySlug(
  slug: string,
  excludeId?: string
): Promise<string> {
  await connectDB();
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: uniqueSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Policy.findOne(query);
    if (!existing) break;
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

export async function createPolicy(data: PolicyInput): Promise<IPolicy> {
  await connectDB();

  const slug = await ensureUniquePolicySlug(
    data.slug || generateSlug(data.title)
  );

  const policy = new Policy({
    title: data.title,
    slug,
    content: data.content,
    excerpt: data.excerpt,
    category: data.category,
    pdfUrl: data.pdfUrl,
    pdfFileName: data.pdfFileName,
    effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
    version: data.version,
    status: data.status || "draft",
    isFeatured: data.isFeatured || false,
    createdBy: data.createdBy,
    publishedAt: data.status === "published" ? new Date() : undefined,
  });

  return policy.save();
}

export async function getPolicies(
  options: GetPoliciesOptions = {}
): Promise<{ policies: IPolicy[]; total: number }> {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (options.status) {
    query.status = options.status;
  }

  if (options.category) {
    query.category = options.category;
  }

  if (options.isFeatured !== undefined) {
    query.isFeatured = options.isFeatured;
  }

  if (options.search) {
    query.$or = [
      { title: { $regex: options.search, $options: "i" } },
      { content: { $regex: options.search, $options: "i" } },
      { excerpt: { $regex: options.search, $options: "i" } },
    ];
  }

  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const [policies, total] = await Promise.all([
    Policy.find(query)
      .populate("category", "name slug color icon")
      .populate("createdBy", "name")
      .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Policy.countDocuments(query),
  ]);

  return { policies, total };
}

export async function getPublishedPolicies(
  options: Omit<GetPoliciesOptions, "status"> = {}
): Promise<{ policies: IPolicy[]; total: number }> {
  return getPolicies({ ...options, status: "published" });
}

export async function getPolicyById(id: string): Promise<IPolicy | null> {
  await connectDB();
  return Policy.findById(id)
    .populate("category", "name slug color icon")
    .populate("createdBy", "name")
    .lean();
}

export async function getPolicyBySlug(slug: string): Promise<IPolicy | null> {
  await connectDB();
  return Policy.findOne({ slug })
    .populate("category", "name slug color icon")
    .populate("createdBy", "name")
    .lean();
}

export async function updatePolicy(
  id: string,
  data: Partial<PolicyInput> & { updatedBy?: string }
): Promise<IPolicy | null> {
  await connectDB();

  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
    if (!data.slug) {
      updateData.slug = await ensureUniquePolicySlug(
        generateSlug(data.title),
        id
      );
    }
  }

  if (data.slug !== undefined) {
    updateData.slug = await ensureUniquePolicySlug(data.slug, id);
  }

  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.pdfUrl !== undefined) updateData.pdfUrl = data.pdfUrl;
  if (data.pdfFileName !== undefined) updateData.pdfFileName = data.pdfFileName;
  if (data.effectiveDate !== undefined) {
    updateData.effectiveDate = data.effectiveDate
      ? new Date(data.effectiveDate)
      : null;
  }
  if (data.version !== undefined) updateData.version = data.version;
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
  if (data.updatedBy) updateData.updatedBy = data.updatedBy;

  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "published") {
      const existing = await Policy.findById(id);
      if (!existing?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
  }

  return Policy.findByIdAndUpdate(id, updateData, { new: true })
    .populate("category", "name slug color icon")
    .populate("createdBy", "name")
    .lean();
}

export async function deletePolicy(id: string): Promise<boolean> {
  await connectDB();
  const result = await Policy.findByIdAndDelete(id);
  return !!result;
}

export async function togglePolicyStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<IPolicy | null> {
  await connectDB();

  const updateData: Record<string, unknown> = { status };
  if (status === "published") {
    const existing = await Policy.findById(id);
    if (!existing?.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  return Policy.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

export async function togglePolicyFeatured(id: string): Promise<IPolicy | null> {
  await connectDB();

  const policy = await Policy.findById(id);
  if (!policy) return null;

  return Policy.findByIdAndUpdate(
    id,
    { isFeatured: !policy.isFeatured },
    { new: true }
  ).lean();
}

export async function incrementPolicyViews(id: string): Promise<void> {
  await connectDB();
  await Policy.findByIdAndUpdate(id, { $inc: { views: 1 } });
}

export async function getPolicyStats(): Promise<{
  total: number;
  draft: number;
  published: number;
  archived: number;
}> {
  await connectDB();

  const [total, draft, published, archived] = await Promise.all([
    Policy.countDocuments(),
    Policy.countDocuments({ status: "draft" }),
    Policy.countDocuments({ status: "published" }),
    Policy.countDocuments({ status: "archived" }),
  ]);

  return { total, draft, published, archived };
}

// ============ SERIALIZATION FUNCTIONS ============

export function serializePolicyCategory(category: IPolicyCategory) {
  return {
    _id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    color: category.color,
    order: category.order,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function serializePolicy(policy: IPolicy) {
  // Handle populated category
  let serializedCategory: unknown;
  const cat = policy.category as unknown;
  if (cat && typeof cat === "object" && "name" in (cat as object)) {
    const populatedCat = cat as { _id: { toString(): string }; name: string; slug: string; color?: string; icon?: string };
    serializedCategory = {
      _id: populatedCat._id.toString(),
      name: populatedCat.name,
      slug: populatedCat.slug,
      color: populatedCat.color,
      icon: populatedCat.icon,
    };
  } else {
    serializedCategory = cat ? String(cat) : null;
  }

  // Handle populated createdBy
  let serializedCreatedBy: unknown;
  const author = policy.createdBy as unknown;
  if (author && typeof author === "object" && "name" in (author as object)) {
    const populatedAuthor = author as { _id: { toString(): string }; name: string };
    serializedCreatedBy = {
      _id: populatedAuthor._id.toString(),
      name: populatedAuthor.name,
    };
  } else {
    serializedCreatedBy = author ? String(author) : null;
  }

  return {
    _id: policy._id.toString(),
    title: policy.title,
    slug: policy.slug,
    content: policy.content,
    excerpt: policy.excerpt,
    category: serializedCategory,
    pdfUrl: policy.pdfUrl,
    pdfFileName: policy.pdfFileName,
    effectiveDate: policy.effectiveDate?.toISOString(),
    version: policy.version,
    status: policy.status,
    isFeatured: policy.isFeatured,
    views: policy.views,
    createdBy: serializedCreatedBy,
    updatedBy: policy.updatedBy?.toString(),
    publishedAt: policy.publishedAt?.toISOString(),
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}
