/**
 * ResponsiveMedia Component
 * Automatically handles responsive sizing for images and videos
 * using Cloudinary transformations.
 */

import { useState, useRef, useEffect } from "react";
import {
  transformCloudinaryUrl,
  getResponsiveUrl,
  generateSrcSet,
  generateSizes,
  getVideoThumbnail,
  getOptimizedVideoUrl,
  getAspectRatioClass,
  isCloudinaryUrl,
  type MediaPreset,
} from "~/lib/utils/cloudinary-media";

interface ResponsiveImageProps {
  src: string;
  alt: string;
  preset?: MediaPreset;
  className?: string;
  containerClassName?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  priority?: boolean;
  fallback?: React.ReactNode;
  onClick?: () => void;
}

/**
 * Responsive Image Component
 * Automatically generates srcset and sizes for optimal loading
 */
export function ResponsiveImage({
  src,
  alt,
  preset = "thumbnail",
  className = "",
  containerClassName = "",
  objectFit = "cover",
  priority = false,
  fallback,
  onClick,
}: ResponsiveImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || error) {
    return fallback ? <>{fallback}</> : null;
  }

  const isCloudinary = isCloudinaryUrl(src);
  const aspectClass = getAspectRatioClass(preset);
  const objectFitClass = objectFit === "cover" ? "object-cover" :
                         objectFit === "contain" ? "object-contain" :
                         objectFit === "fill" ? "object-fill" : "";

  return (
    <div
      className={`relative overflow-hidden ${aspectClass} ${containerClassName}`}
      onClick={onClick}
    >
      {/* Loading placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      <img
        src={isCloudinary ? getResponsiveUrl(src, preset, "desktop") : src}
        srcSet={isCloudinary ? generateSrcSet(src, preset) : undefined}
        sizes={isCloudinary ? generateSizes(preset) : undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full ${objectFitClass} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    </div>
  );
}

interface ResponsiveVideoProps {
  src: string;
  poster?: string;
  preset?: MediaPreset;
  className?: string;
  containerClassName?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

/**
 * Responsive Video Component
 * Handles video with optimized quality and responsive thumbnails
 */
export function ResponsiveVideo({
  src,
  poster,
  preset = "hero",
  className = "",
  containerClassName = "",
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  playsInline = true,
  onPlay,
  onPause,
  onEnded,
}: ResponsiveVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const isCloudinary = isCloudinaryUrl(src);
  const aspectClass = getAspectRatioClass(preset);

  // Generate optimized video URL
  const videoUrl = isCloudinary
    ? getOptimizedVideoUrl(src, { quality: "auto" })
    : src;

  // Generate poster/thumbnail
  const posterUrl = poster
    ? isCloudinaryUrl(poster)
      ? getResponsiveUrl(poster, preset, "desktop")
      : poster
    : isCloudinary
    ? getVideoThumbnail(src, { width: 1280, height: 720 })
    : undefined;

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  if (error) {
    return (
      <div className={`relative overflow-hidden ${aspectClass} ${containerClassName}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
          <p className="text-sm">Video unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${containerClassName}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline={playsInline}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={onEnded}
        onError={() => setError(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    </div>
  );
}

interface SlideshowImageProps {
  src: string;
  alt: string;
  preset?: MediaPreset;
  className?: string;
  objectFit?: "cover" | "contain";
  showGradient?: boolean;
  gradientPosition?: "top" | "bottom" | "both";
}

/**
 * Slideshow Image Component
 * Optimized for slideshow/carousel contexts with optional gradients
 */
export function SlideshowImage({
  src,
  alt,
  preset = "hero",
  className = "",
  objectFit = "cover",
  showGradient = true,
  gradientPosition = "bottom",
}: SlideshowImageProps) {
  const [loaded, setLoaded] = useState(false);
  const isCloudinary = isCloudinaryUrl(src);
  const objectFitClass = objectFit === "cover" ? "object-cover" : "object-contain";

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
      )}

      {/* Image */}
      <img
        src={isCloudinary ? getResponsiveUrl(src, preset, "desktop") : src}
        srcSet={isCloudinary ? generateSrcSet(src, preset) : undefined}
        sizes={isCloudinary ? generateSizes(preset) : undefined}
        alt={alt}
        loading="eager"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full ${objectFitClass} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
      />

      {/* Gradients for text readability */}
      {showGradient && (gradientPosition === "top" || gradientPosition === "both") && (
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      )}
      {showGradient && (gradientPosition === "bottom" || gradientPosition === "both") && (
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

interface SlideshowVideoProps {
  src: string;
  poster?: string;
  preset?: MediaPreset;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  showGradient?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

/**
 * Slideshow Video Component
 * Optimized for background video in slideshows
 */
export function SlideshowVideo({
  src,
  poster,
  preset = "hero",
  autoPlay = false,
  muted = true,
  loop = true,
  showGradient = true,
  onPlay,
  onPause,
  onEnded,
  videoRef: externalRef,
}: SlideshowVideoProps) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef || internalRef;
  const [error, setError] = useState(false);

  const isCloudinary = isCloudinaryUrl(src);

  // Optimized video URL
  const videoUrl = isCloudinary
    ? getOptimizedVideoUrl(src, { quality: "auto" })
    : src;

  // Thumbnail
  const posterUrl = poster
    ? isCloudinaryUrl(poster)
      ? getResponsiveUrl(poster, preset, "desktop")
      : poster
    : isCloudinary
    ? getVideoThumbnail(src, { width: 1920, height: 1080 })
    : undefined;

  if (error) {
    return (
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
        <p className="text-white/60">Video unavailable</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={() => setError(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradients */}
      {showGradient && (
        <>
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
}

// Export utility functions for direct use
export {
  transformCloudinaryUrl,
  getResponsiveUrl,
  generateSrcSet,
  generateSizes,
  getVideoThumbnail,
  getOptimizedVideoUrl,
  getAspectRatioClass,
  isCloudinaryUrl,
};
