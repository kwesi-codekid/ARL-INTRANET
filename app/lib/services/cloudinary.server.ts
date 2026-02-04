/**
 * Cloudinary Service
 * Handles file uploads to Cloudinary cloud storage
 */

import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
  type?: "image" | "video" | "audio" | "raw";
  thumbnail?: string;
}

/**
 * Upload a file buffer to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param fileName - Original file name (used to derive public_id)
 * @param folder - Subfolder within ARL Intranet folder
 * @param resourceType - Type of resource (image, video, raw, auto)
 * @returns Promise resolving to upload result
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = "",
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<CloudinaryUploadResult> {
  try {
    // Generate a unique public_id based on the file name and current timestamp
    const timestamp = Date.now();
    const baseName = fileName.split(".")[0].replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = `${baseName}_${timestamp}`;

    // Create the folder path (always within ARL Intranet main folder)
    const folderPath = folder ? `ARL Intranet/${folder}` : "ARL Intranet";

    // Upload to Cloudinary
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error("Cloudinary upload error:", error);
            resolve({
              success: false,
              error: error?.message || "Upload failed with no result",
            });
          } else {
            // Determine the type from the result
            let type: "image" | "video" | "audio" | "raw" = "raw";
            if (result.resource_type === "image") {
              type = "image";
            } else if (result.resource_type === "video") {
              // Cloudinary stores audio as video resource type
              if (result.format && ["mp3", "wav", "ogg", "webm", "aac", "m4a"].includes(result.format)) {
                type = "audio";
              } else {
                type = "video";
              }
            }

            resolve({
              success: true,
              url: result.secure_url,
              publicId: result.public_id,
              type,
              // For videos, Cloudinary auto-generates thumbnails
              thumbnail: result.resource_type === "video"
                ? result.secure_url.replace(/\.[^/.]+$/, ".jpg")
                : undefined,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload a base64 data URL to Cloudinary
 * @param dataUrl - Base64 data URL (data:image/png;base64,...)
 * @param folder - Subfolder within ARL Intranet folder
 * @returns Promise resolving to upload result
 */
export async function uploadBase64ToCloudinary(
  dataUrl: string,
  folder: string = "thumbnails"
): Promise<CloudinaryUploadResult> {
  try {
    const folderPath = folder ? `ARL Intranet/${folder}` : "ARL Intranet";
    const timestamp = Date.now();
    const publicId = `thumb_${timestamp}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: folderPath,
      public_id: publicId,
      overwrite: true,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      type: "image",
    };
  } catch (error) {
    console.error("Error uploading base64 to Cloudinary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Cloudinary public ID of the file to delete
 * @param resourceType - Type of resource
 * @returns Promise resolving to deletion success
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === "ok";
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
}

/**
 * Delete a file from Cloudinary using its URL
 * Extracts the public_id from the URL and determines resource type
 * @param url - Cloudinary URL of the file to delete
 * @returns Promise resolving to deletion success
 */
export async function deleteFromCloudinaryByUrl(url: string): Promise<boolean> {
  try {
    // Skip if not a Cloudinary URL
    if (!url.includes("cloudinary.com") && !url.includes("res.cloudinary.com")) {
      // It might be a local file URL, return true to not block deletion
      console.log("Not a Cloudinary URL, skipping:", url);
      return true;
    }

    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{folder}/{public_id}.{ext}
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    if (!matches) {
      console.error("Could not extract public_id from URL:", url);
      return false;
    }

    const publicId = matches[1];

    // Determine resource type from URL
    let resourceType: "image" | "video" | "raw" = "image";
    if (url.includes("/video/upload/")) {
      resourceType = "video";
    } else if (url.includes("/raw/upload/")) {
      resourceType = "raw";
    }

    return await deleteFromCloudinary(publicId, resourceType);
  } catch (error) {
    console.error("Error deleting from Cloudinary by URL:", error);
    return false;
  }
}

/**
 * Get optimized URL for an image with transformations
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 * @returns Transformed URL
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg" | "png";
  } = {}
): string {
  if (!url.includes("cloudinary.com")) {
    return url;
  }

  const { width, height, quality = 80, format = "auto" } = options;

  const transformations: string[] = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  // Insert transformations into URL
  return url.replace("/upload/", `/upload/${transformations.join(",")}/`);
}

export { cloudinary };
