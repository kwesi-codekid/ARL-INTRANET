/**
 * Cloudinary Media Utilities
 * Provides responsive image and video transformations for consistent sizing
 * across all slideshows and media displays on mobile and desktop.
 */

// Standard breakpoints matching Tailwind defaults
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Preset configurations for different media contexts
export const MEDIA_PRESETS = {
  // Hero slideshow - full width banners
  hero: {
    mobile: { width: 768, height: 480 },
    tablet: { width: 1280, height: 625 },
    desktop: { width: 1920, height: 750 },
  },
  // Company values slideshow - wide aspect ratio
  companyValues: {
    mobile: { width: 768, height: 432 }, // 16:9
    tablet: { width: 1280, height: 548 }, // ~21:9
    desktop: { width: 1920, height: 822 }, // ~21:9
  },
  // Thumbnail cards (news, PSI talks, etc.)
  thumbnail: {
    mobile: { width: 480, height: 270 },
    tablet: { width: 640, height: 360 },
    desktop: { width: 800, height: 450 },
  },
  // Gallery grid thumbnails - square
  galleryThumb: {
    mobile: { width: 300, height: 300 },
    tablet: { width: 400, height: 400 },
    desktop: { width: 500, height: 500 },
  },
  // Gallery album covers - 4:3 aspect
  albumCover: {
    mobile: { width: 480, height: 360 },
    tablet: { width: 640, height: 480 },
    desktop: { width: 800, height: 600 },
  },
  // Lightbox / full screen view
  lightbox: {
    mobile: { width: 768, height: 576 },
    tablet: { width: 1280, height: 960 },
    desktop: { width: 1920, height: 1440 },
  },
  // Executive/profile photos
  profile: {
    mobile: { width: 256, height: 256 },
    tablet: { width: 320, height: 320 },
    desktop: { width: 400, height: 400 },
  },
  // News featured image
  newsFeatured: {
    mobile: { width: 768, height: 432 },
    tablet: { width: 1024, height: 576 },
    desktop: { width: 1600, height: 900 },
  },
} as const;

export type MediaPreset = keyof typeof MEDIA_PRESETS;
export type DeviceSize = "mobile" | "tablet" | "desktop";

interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number | "auto";
  format?: "auto" | "webp" | "jpg" | "png" | "avif";
  crop?: "fill" | "fit" | "scale" | "crop" | "thumb" | "auto";
  gravity?: "auto" | "face" | "faces" | "center" | "north" | "south" | "east" | "west";
  aspectRatio?: string; // e.g., "16:9", "4:3", "1:1"
  dpr?: number | "auto"; // Device pixel ratio
  fetchFormat?: "auto";
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes("cloudinary.com") || url.includes("res.cloudinary.com");
}

/**
 * Transform a Cloudinary URL with optimization parameters
 */
export function transformCloudinaryUrl(
  url: string,
  options: TransformOptions = {}
): string {
  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  const {
    width,
    height,
    quality = 90,
    format = "auto",
    crop = "fit",
    gravity,
    aspectRatio,
    dpr = "auto",
  } = options;

  const transforms: string[] = [];

  // Add transformations
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity && crop !== "scale" && crop !== "fit") transforms.push(`g_${gravity}`);
  if (aspectRatio) transforms.push(`ar_${aspectRatio.replace(":", "_")}`);
  if (quality) transforms.push(`q_${quality}`);
  if (format) transforms.push(`f_${format}`);
  if (dpr) transforms.push(`dpr_${dpr}`);

  if (transforms.length === 0) {
    return url;
  }

  const transformString = transforms.join(",");

  // Handle different URL patterns
  // Pattern 1: /upload/v123456/...
  // Pattern 2: /upload/...
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/${transformString}/`);
  }

  return url;
}

/**
 * Get a responsive image URL for a specific preset and device size
 */
export function getResponsiveUrl(
  url: string,
  preset: MediaPreset,
  device: DeviceSize = "desktop",
  options: Partial<TransformOptions> = {}
): string {
  const presetConfig = MEDIA_PRESETS[preset][device];

  return transformCloudinaryUrl(url, {
    ...presetConfig,
    crop: "fit",
    quality: 90,
    format: "auto",
    ...options,
  });
}

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(
  url: string,
  preset: MediaPreset,
  options: Partial<TransformOptions> = {}
): string {
  if (!url || !isCloudinaryUrl(url)) {
    return "";
  }

  const presetConfig = MEDIA_PRESETS[preset];
  const srcsetParts: string[] = [];

  // Mobile
  const mobileUrl = transformCloudinaryUrl(url, {
    ...presetConfig.mobile,
    ...options,
  });
  srcsetParts.push(`${mobileUrl} ${presetConfig.mobile.width}w`);

  // Tablet
  const tabletUrl = transformCloudinaryUrl(url, {
    ...presetConfig.tablet,
    ...options,
  });
  srcsetParts.push(`${tabletUrl} ${presetConfig.tablet.width}w`);

  // Desktop
  const desktopUrl = transformCloudinaryUrl(url, {
    ...presetConfig.desktop,
    ...options,
  });
  srcsetParts.push(`${desktopUrl} ${presetConfig.desktop.width}w`);

  return srcsetParts.join(", ");
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(preset: MediaPreset): string {
  const presetConfig = MEDIA_PRESETS[preset];

  return `(max-width: ${BREAKPOINTS.sm}px) ${presetConfig.mobile.width}px, ` +
         `(max-width: ${BREAKPOINTS.lg}px) ${presetConfig.tablet.width}px, ` +
         `${presetConfig.desktop.width}px`;
}

/**
 * Get video thumbnail URL from Cloudinary video URL
 */
export function getVideoThumbnail(
  videoUrl: string,
  options: TransformOptions = {}
): string {
  if (!videoUrl || !isCloudinaryUrl(videoUrl)) {
    return videoUrl;
  }

  // Convert video URL to image URL for thumbnail
  // Change /video/upload/ to /video/upload/{transforms}/
  // And change extension to .jpg
  const thumbnailUrl = videoUrl
    .replace(/\.[^/.]+$/, ".jpg"); // Change extension to .jpg

  return transformCloudinaryUrl(thumbnailUrl, {
    quality: 90,
    format: "auto",
    ...options,
  });
}

/**
 * Get optimized video URL with quality settings
 */
export function getOptimizedVideoUrl(
  url: string,
  options: {
    quality?: number | "auto";
    width?: number;
    height?: number;
  } = {}
): string {
  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  const { quality = "auto", width, height } = options;
  const transforms: string[] = [];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push(`q_${quality}`);
  transforms.push("f_auto"); // Auto format (webm, mp4, etc.)

  if (transforms.length === 0) {
    return url;
  }

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}

/**
 * Helper to get responsive props for an <img> element
 */
export function getResponsiveImageProps(
  url: string,
  preset: MediaPreset,
  alt: string,
  options: Partial<TransformOptions> = {}
): {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
} {
  return {
    src: getResponsiveUrl(url, preset, "desktop", options),
    srcSet: generateSrcSet(url, preset, options),
    sizes: generateSizes(preset),
    alt,
  };
}

/**
 * CSS class helper for responsive aspect ratios
 */
export function getAspectRatioClass(preset: MediaPreset): string {
  const aspectClasses: Record<MediaPreset, string> = {
    hero: "aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9]",
    companyValues: "aspect-[16/9] sm:aspect-[21/9]",
    thumbnail: "aspect-video",
    galleryThumb: "aspect-square",
    albumCover: "aspect-[4/3]",
    lightbox: "aspect-video",
    profile: "aspect-square",
    newsFeatured: "aspect-video",
  };

  return aspectClasses[preset] || "aspect-video";
}
