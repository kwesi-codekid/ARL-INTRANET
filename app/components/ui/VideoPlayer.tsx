/**
 * Smart Video Player Component
 * Handles both embedded videos (YouTube, Vimeo) and local video files
 */

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RefreshCw } from "lucide-react";
import { Button, Slider } from "@heroui/react";

interface VideoPlayerProps {
  src: string;
  title?: string;
  thumbnail?: string;
  autoPlay?: boolean;
  className?: string;
  onPlay?: () => void;
  onEnded?: () => void;
}

// Detect video type from URL
function getVideoType(url: string): "youtube" | "vimeo" | "local" {
  if (!url) return "local";

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }
  if (url.includes("vimeo.com")) {
    return "vimeo";
  }
  return "local";
}

// Convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string {
  // Already an embed URL
  if (url.includes("/embed/")) return url;

  // Extract video ID
  let videoId = "";

  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
  } else if (url.includes("/v/")) {
    videoId = url.split("/v/")[1]?.split("?")[0] || "";
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

// Convert Vimeo URL to embed URL
function getVimeoEmbedUrl(url: string): string {
  // Already an embed URL
  if (url.includes("player.vimeo.com")) return url;

  // Extract video ID
  const match = url.match(/vimeo\.com\/(\d+)/);
  const videoId = match ? match[1] : "";

  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}

export function VideoPlayer({
  src,
  title = "Video",
  thumbnail,
  autoPlay = false,
  className = "",
  onPlay,
  onEnded,
}: VideoPlayerProps) {
  const videoType = getVideoType(src);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showThumbnail, setShowThumbnail] = useState(!autoPlay && !!thumbnail);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle embedded videos (YouTube, Vimeo)
  if (videoType === "youtube" || videoType === "vimeo") {
    const embedUrl = videoType === "youtube"
      ? getYouTubeEmbedUrl(src)
      : getVimeoEmbedUrl(src);

    if (showThumbnail && thumbnail) {
      return (
        <div
          className={`relative aspect-video bg-black cursor-pointer group ${className}`}
          onClick={() => {
            setShowThumbnail(false);
            onPlay?.();
          }}
        >
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
              <Play size={40} className="text-red-600 ml-2" fill="currentColor" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative aspect-video bg-black ${className}`}>
        <iframe
          src={`${embedUrl}?autoplay=1&rel=0`}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const [isEnded, setIsEnded] = useState(false);

  // Auto-play when autoPlay prop is true (for playlist functionality)
  useEffect(() => {
    if (autoPlay && videoRef.current && !showThumbnail) {
      // Small delay to ensure video is ready
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          setIsPlaying(true);
          onPlay?.();
        } catch (err) {
          // Autoplay was prevented (browser policy)
          console.log("Autoplay prevented:", err);
        }
      };
      playVideo();
    }
  }, [autoPlay, src]); // Re-run when autoPlay or src changes

  // Handle local/direct video files
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (isEnded) {
          videoRef.current.currentTime = 0;
          setIsEnded(false);
        }
        videoRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsEnded(false);
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number | number[]) => {
    const seekTime = Array.isArray(value) ? value[0] : value;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (value: number | number[]) => {
    const vol = Array.isArray(value) ? value[0] : value;
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    setShowControls(true);
    onEnded?.();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show thumbnail with play button
  if (showThumbnail && thumbnail) {
    return (
      <div
        className={`relative aspect-video bg-black cursor-pointer group ${className}`}
        onClick={() => {
          setShowThumbnail(false);
          setIsPlaying(true);
          setTimeout(() => videoRef.current?.play(), 100);
          onPlay?.();
        }}
      >
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
            <Play size={40} className="text-blue-600 ml-2" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video bg-black group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay={autoPlay}
        playsInline
      />

      {/* Click to play/pause */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handlePlayPause}
      />

      {/* Ended overlay with replay button */}
      {isEnded && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
          <button
            onClick={handleReplay}
            className="w-24 h-24 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110 mb-4"
          >
            <RefreshCw size={48} className="text-white" />
          </button>
          <p className="text-white text-lg font-medium">Watch Again</p>
        </div>
      )}

      {/* Play button overlay when paused (not ended) */}
      {!isPlaying && !isEnded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
            <Play size={40} className="text-white ml-2" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div className="mb-2">
          <Slider
            size="sm"
            step={0.1}
            maxValue={duration || 100}
            minValue={0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full"
            classNames={{
              track: "bg-white/30",
              filler: "bg-white",
              thumb: "bg-white w-3 h-3",
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-white"
              onPress={handlePlayPause}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>

            {/* Volume */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-white"
              onPress={toggleMute}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>

            <div className="w-20 hidden sm:block">
              <Slider
                size="sm"
                step={0.1}
                maxValue={1}
                minValue={0}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                classNames={{
                  track: "bg-white/30",
                  filler: "bg-white",
                  thumb: "bg-white w-2 h-2",
                }}
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Fullscreen */}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-white"
            onPress={handleFullscreen}
          >
            <Maximize size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
