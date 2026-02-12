/**
 * File Upload Service
 * Task: 1.1.4.3.3, 1.2.1.2.1-3 (Multimedia Support)
 *
 * Uses Cloudinary for cloud storage of all media files
 */

import {
  uploadToCloudinary,
  uploadBase64ToCloudinary,
  deleteFromCloudinaryByUrl,
  type CloudinaryUploadResult,
} from "./cloudinary.server";

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

// Legacy constants for backward compatibility
const MAX_FILE_SIZE = MAX_IMAGE_SIZE;
const ALLOWED_TYPES = ALLOWED_IMAGE_TYPES;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface MediaUploadResult extends UploadResult {
  type?: "image" | "video" | "audio";
  thumbnail?: string;
}

/**
 * Upload an image file to Cloudinary
 */
export async function uploadImage(
  file: File,
  subdir: string = "photos"
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, file.name, subdir, "image");

    if (result.success && result.url) {
      return { success: true, url: result.url };
    }

    return { success: false, error: result.error || "Upload failed" };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(url: string): Promise<boolean> {
  return deleteFromCloudinaryByUrl(url);
}

/**
 * Upload a video file to Cloudinary
 * Task: 1.2.1.2.1 - Extend upload system for video files
 */
export async function uploadVideo(
  file: File,
  subdir: string = "videos"
): Promise<MediaUploadResult> {
  // Task: 1.2.1.2.2 - Implement video file validation (type, size, duration)
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return {
      success: false,
      error: `Video too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, file.name, subdir, "video");

    if (result.success && result.url) {
      return {
        success: true,
        url: result.url,
        type: "video",
        thumbnail: result.thumbnail,
      };
    }

    return { success: false, error: result.error || "Video upload failed" };
  } catch (error) {
    console.error("Video upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Video upload failed",
    };
  }
}

/**
 * Upload an audio file to Cloudinary
 * Task: 1.2.1.2.3 - Create audio file upload support
 */
export async function uploadAudio(
  file: File,
  subdir: string = "audio"
): Promise<MediaUploadResult> {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_AUDIO_SIZE) {
    return {
      success: false,
      error: `Audio too large. Maximum size: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Audio files are stored as "video" resource type in Cloudinary
    const result = await uploadToCloudinary(buffer, file.name, subdir, "video");

    if (result.success && result.url) {
      return {
        success: true,
        url: result.url,
        type: "audio",
      };
    }

    return { success: false, error: result.error || "Audio upload failed" };
  } catch (error) {
    console.error("Audio upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Audio upload failed",
    };
  }
}

/**
 * Generic media upload function that detects type
 */
export async function uploadMedia(
  file: File,
  subdir?: string
): Promise<MediaUploadResult> {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const result = await uploadImage(file, subdir || "photos");
    return { ...result, type: "image" };
  }

  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return uploadVideo(file, subdir || "videos");
  }

  if (ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return uploadAudio(file, subdir || "audio");
  }

  return {
    success: false,
    error: "Unsupported file type",
  };
}

/**
 * Delete any media file from Cloudinary
 */
export async function deleteMedia(url: string): Promise<boolean> {
  return deleteFromCloudinaryByUrl(url);
}

/**
 * Get media type from MIME type
 */
export function getMediaType(mimeType: string): "image" | "video" | "audio" | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return "audio";
  return null;
}

/**
 * Generic file upload function that auto-detects file type
 * Used by admin routes for uploading images and videos
 * Throws an error if upload fails
 */
export async function uploadFile(
  file: File,
  subdir: string = "uploads"
): Promise<{ url: string; type?: "image" | "video" | "audio" }> {
  let result: MediaUploadResult;

  // Determine upload type based on file MIME type
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    result = await uploadImage(file, subdir);
    if (result.success && result.url) {
      return { url: result.url, type: "image" };
    }
  } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    result = await uploadVideo(file, subdir);
    if (result.success && result.url) {
      return { url: result.url, type: "video" };
    }
  } else if (ALLOWED_AUDIO_TYPES.includes(file.type)) {
    result = await uploadAudio(file, subdir);
    if (result.success && result.url) {
      return { url: result.url, type: "audio" };
    }
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // If we get here, upload failed
  throw new Error(result?.error || "Upload failed");
}

/**
 * Upload a PDF document to Cloudinary
 * Used for safety documents and policy files
 */
export async function uploadPdf(
  file: File,
  subdir: string = "policies"
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type. Only PDF files are allowed.`,
    };
  }

  // Validate file size
  if (file.size > MAX_PDF_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size: ${MAX_PDF_SIZE / 1024 / 1024}MB`,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // PDFs are stored as "raw" resource type in Cloudinary
    const result = await uploadToCloudinary(buffer, file.name, subdir, "raw");

    if (result.success && result.url) {
      return { success: true, url: result.url };
    }

    return { success: false, error: result.error || "PDF upload failed" };
  } catch (error) {
    console.error("PDF upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "PDF upload failed",
    };
  }
}

/**
 * Upload a PDF document (legacy alias)
 * Used for safety documents and other PDF files
 */
export async function uploadDocument(
  file: File,
  subdir: string = "documents"
): Promise<{ url: string }> {
  // Validate file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error(`Invalid document type: ${file.type}. Only PDF files are allowed.`);
  }

  // Validate file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, file.name, subdir, "raw");

    if (result.success && result.url) {
      return { url: result.url };
    }

    throw new Error(result.error || "Failed to upload document");
  } catch (error) {
    console.error("Document upload error:", error);
    throw new Error("Failed to upload document");
  }
}

/**
 * Upload thumbnail from base64 data URL
 * Task: 1.2.1.2.4 - Upload thumbnail from base64 data URL
 */
export async function uploadThumbnailFromBase64(
  dataUrl: string,
  subdir: string = "thumbnails"
): Promise<UploadResult> {
  try {
    // Validate the data URL format
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: "Invalid data URL format" };
    }

    const mimeType = matches[1];

    // Validate mime type
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return { success: false, error: "Invalid image type for thumbnail" };
    }

    // Check approximate size (base64 is ~33% larger than binary)
    const base64Data = matches[2];
    const approximateSize = (base64Data.length * 3) / 4;
    if (approximateSize > 1024 * 1024) {
      return { success: false, error: "Thumbnail too large (max 1MB)" };
    }

    const result = await uploadBase64ToCloudinary(dataUrl, subdir);

    if (result.success && result.url) {
      return { success: true, url: result.url };
    }

    return { success: false, error: result.error || "Thumbnail upload failed" };
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Thumbnail upload failed",
    };
  }
}
