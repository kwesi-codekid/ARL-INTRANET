import { connectDB } from "~/lib/db/connection.server";
import { CompanyInfo } from "~/lib/db/models/company-info.server";
import type { ICompanyInfo } from "~/lib/db/models/company-info.server";

export interface CoreValueInput {
  title: string;
  description: string;
  icon?: string;
}

export interface CompanyInfoInput {
  vision: string;
  mission: string;
  coreValues: CoreValueInput[];
  visionImage?: string;
  missionImage?: string;
  valuesImage?: string;
  updatedBy?: string;
}

export interface CompanyImagesInput {
  visionImage?: string;
  missionImage?: string;
  valuesImage?: string;
  updatedBy?: string;
}

/**
 * Get the company info (singleton document)
 */
export async function getCompanyInfo(): Promise<ICompanyInfo | null> {
  await connectDB();
  return CompanyInfo.findOne().lean();
}

/**
 * Create or update company info
 */
export async function upsertCompanyInfo(
  data: CompanyInfoInput
): Promise<ICompanyInfo> {
  await connectDB();

  const existing = await CompanyInfo.findOne();

  const updateData: Record<string, unknown> = {
    vision: data.vision,
    mission: data.mission,
    coreValues: data.coreValues,
    updatedBy: data.updatedBy,
  };

  // Only update images if provided
  if (data.visionImage) updateData.visionImage = data.visionImage;
  if (data.missionImage) updateData.missionImage = data.missionImage;
  if (data.valuesImage) updateData.valuesImage = data.valuesImage;

  if (existing) {
    const updated = await CompanyInfo.findByIdAndUpdate(
      existing._id,
      updateData,
      { new: true }
    );
    return updated!;
  }

  const newCompanyInfo = new CompanyInfo(updateData);
  return newCompanyInfo.save();
}

/**
 * Update only company images (for slideshow)
 */
export async function updateCompanyImages(
  data: CompanyImagesInput
): Promise<ICompanyInfo | null> {
  await connectDB();

  const existing = await CompanyInfo.findOne();

  if (!existing) {
    // Create with defaults if doesn't exist
    const newCompanyInfo = new CompanyInfo({
      vision: "Our Vision",
      mission: "Our Mission",
      coreValues: [],
      visionImage: data.visionImage || "/uploads/company/vision.png",
      missionImage: data.missionImage || "/uploads/company/mission.png",
      valuesImage: data.valuesImage || "/uploads/company/values.png",
      updatedBy: data.updatedBy,
    });
    return newCompanyInfo.save();
  }

  const updateData: Record<string, unknown> = {
    updatedBy: data.updatedBy,
  };

  if (data.visionImage) updateData.visionImage = data.visionImage;
  if (data.missionImage) updateData.missionImage = data.missionImage;
  if (data.valuesImage) updateData.valuesImage = data.valuesImage;

  return CompanyInfo.findByIdAndUpdate(existing._id, updateData, { new: true });
}

/**
 * Get company images for slideshow
 */
export async function getCompanyImages() {
  await connectDB();
  const info = await CompanyInfo.findOne().lean();

  // Return defaults if no data exists
  if (!info) {
    return {
      visionImage: "/uploads/company/vision.png",
      missionImage: "/uploads/company/mission.png",
      valuesImage: "/uploads/company/values.png",
    };
  }

  return {
    visionImage: info.visionImage || "/uploads/company/vision.png",
    missionImage: info.missionImage || "/uploads/company/mission.png",
    valuesImage: info.valuesImage || "/uploads/company/values.png",
  };
}

/**
 * Serialize company info for JSON response
 */
export function serializeCompanyInfo(info: ICompanyInfo) {
  return {
    _id: info._id.toString(),
    vision: info.vision,
    mission: info.mission,
    coreValues: info.coreValues,
    visionImage: info.visionImage || "/uploads/company/vision.png",
    missionImage: info.missionImage || "/uploads/company/mission.png",
    valuesImage: info.valuesImage || "/uploads/company/values.png",
    updatedBy: info.updatedBy?.toString(),
    createdAt: info.createdAt.toISOString(),
    updatedAt: info.updatedAt.toISOString(),
  };
}
