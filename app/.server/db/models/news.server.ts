import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * News categories
 */
export const NEWS_CATEGORIES = [
  "company",
  "operations",
  "safety",
  "hr",
  "community",
  "general",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/**
 * News status
 */
export const NEWS_STATUSES = ["draft", "published", "archived"] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

/**
 * Image interface for news articles
 */
export interface INewsImage {
  url: string;
  alt?: string;
  caption?: string;
}

/**
 * News document interface
 */
export interface INews {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  author?: Types.ObjectId;
  authorName: string;
  images: INewsImage[];
  featuredImage?: string;
  isFeatured: boolean;
  status: NewsStatus;
  publishedAt?: Date;
  viewCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * News document with Mongoose Document methods
 */
export interface INewsDocument extends INews, Document {}

/**
 * News model static methods
 */
export interface INewsModel extends Model<INewsDocument> {
  findPublished(): mongoose.Query<INewsDocument[], INewsDocument>;
  findBySlug(slug: string): Promise<INewsDocument | null>;
  incrementViewCount(id: Types.ObjectId): Promise<INewsDocument | null>;
}

/**
 * Image sub-schema
 */
const imageSchema = new Schema<INewsImage>(
  {
    url: { type: String, required: true },
    alt: { type: String },
    caption: { type: String },
  },
  { _id: false }
);

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content: string, maxLength = 200): string {
  const plainText = content.replace(/<[^>]*>/g, "").trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

/**
 * News schema definition
 */
const newsSchema = new Schema<INewsDocument, INewsModel>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Excerpt cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    category: {
      type: String,
      enum: {
        values: NEWS_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      default: "general",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    featuredImage: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: NEWS_STATUSES,
        message: "{VALUE} is not a valid status",
      },
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1, status: 1, publishedAt: -1 });
newsSchema.index(
  { title: "text", content: "text", tags: "text" },
  { weights: { title: 10, tags: 5, content: 1 } }
);

/**
 * Pre-save middleware: Generate slug and excerpt
 */
newsSchema.pre("save", function () {
  // Generate slug from title if not provided or title changed
  if (!this.slug || this.isModified("title")) {
    const baseSlug = generateSlug(this.title);
    this.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  // Generate excerpt from content if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = generateExcerpt(this.content);
  }

  // Set publishedAt when status changes to published
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

/**
 * Static method: Find published articles
 */
newsSchema.statics.findPublished = function () {
  return this.find({ status: "published" }).sort({ publishedAt: -1 });
};

/**
 * Static method: Find by slug
 */
newsSchema.statics.findBySlug = function (
  slug: string
): Promise<INewsDocument | null> {
  return this.findOne({ slug, status: "published" });
};

/**
 * Static method: Increment view count
 */
newsSchema.statics.incrementViewCount = function (
  id: Types.ObjectId
): Promise<INewsDocument | null> {
  return this.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true });
};

/**
 * News model
 */
export const News =
  (mongoose.models.News as INewsModel) ||
  mongoose.model<INewsDocument, INewsModel>("News", newsSchema);
