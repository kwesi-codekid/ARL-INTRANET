/**
 * File Upload Service
 * Task: 1.1.4.3.3, 1.2.1.2.1-3 (Multimedia Support)
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];

// Legacy constant for backward compatibility
const MAX_FILE_SIZE = MAX_IMAGE_SIZE;
const ALLOWED_TYPES = ALLOWED_IMAGE_TYPES;

// Ensure upload directory exists
function ensureUploadDir(subdir: string = "") {
  const dir = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

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
    const uploadDir = ensureUploadDir(subdir);

    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${subdir}/${filename}`;
    return { success: true, url };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract path from URL
    const relativePath = url.replace(/^\/uploads\//, "");
    const filepath = path.join(UPLOAD_DIR, relativePath);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

// Task: 1.2.1.2.1 - Extend upload system for video files
export interface MediaUploadResult extends UploadResult {
  type?: "image" | "video" | "audio";
  thumbnail?: string;
}

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
    const uploadDir = ensureUploadDir(subdir);

    // Generate unique filename
    const ext = path.extname(file.name) || ".mp4";
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${subdir}/${filename}`;
    return { success: true, url, type: "video" };
  } catch (error) {
    console.error("Video upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Video upload failed",
    };
  }
}

// Task: 1.2.1.2.3 - Create audio file upload support
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
    const uploadDir = ensureUploadDir(subdir);

    // Generate unique filename
    const ext = path.extname(file.name) || ".mp3";
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${subdir}/${filename}`;
    return { success: true, url, type: "audio" };
  } catch (error) {
    console.error("Audio upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Audio upload failed",
    };
  }
}

// Generic media upload function that detects type
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

// Delete any media file
export async function deleteMedia(url: string): Promise<boolean> {
  return deleteImage(url); // Same logic works for all file types
}

// Get media type from URL or MIME type
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

// Allowed document types
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Upload a PDF document
 * Used for safety documents and other PDF files
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

  // Validate file size (20MB for policies)
  const MAX_PDF_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_PDF_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size: ${MAX_PDF_SIZE / 1024 / 1024}MB`,
    };
  }

  try {
    const uploadDir = ensureUploadDir(subdir);

    // Generate unique filename
    const ext = ".pdf";
    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${subdir}/${filename}`;
    return { success: true, url };
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
    // Generate unique filename
    const ext = ".pdf";
    const uniqueName = `${crypto.randomBytes(16).toString("hex")}${ext}`;

    // Ensure directory exists
    const uploadDir = ensureUploadDir(subdir);

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return public URL
    const url = `/uploads/${subdir}/${uniqueName}`;
    return { url };
  } catch (error) {
    console.error("Document upload error:", error);
    throw new Error("Failed to upload document");
  }
}

// Task: 1.2.1.2.4 - Upload thumbnail from base64 data URL
export async function uploadThumbnailFromBase64(
  dataUrl: string,
  subdir: string = "thumbnails"
): Promise<UploadResult> {
  try {
    // Parse the data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: "Invalid data URL format" };
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Validate mime type
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return { success: false, error: "Invalid image type for thumbnail" };
    }

    const uploadDir = ensureUploadDir(subdir);

    // Generate unique filename
    const ext = mimeType === "image/png" ? ".png" : ".jpg";
    const filename = `thumb_${crypto.randomBytes(12).toString("hex")}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Data, "base64");

    // Check file size (max 1MB for thumbnails)
    if (buffer.length > 1024 * 1024) {
      return { success: false, error: "Thumbnail too large (max 1MB)" };
    }

    fs.writeFileSync(filepath, buffer);

    const url = `/uploads/${subdir}/${filename}`;
    return { success: true, url };
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Thumbnail upload failed",
    };
  }
}
