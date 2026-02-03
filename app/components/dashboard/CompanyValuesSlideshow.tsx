/**
 * Company Values Slideshow Component
 * Displays Mission, Vision, and Values images in a rotating carousel
 */

import { useState, useEffect } from "react";
import { Card, Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Default images (fallback if no database images)
const defaultSlides = [
  {
    id: "vision",
    title: "Our Vision",
    image: "/uploads/company/vision.png",
    alt: "Nguvu Mining Vision - To be a top tier gold mining company, renowned for responsible mining through optimization, exploration, acquisition and corporate citizenship.",
  },
  {
    id: "mission",
    title: "Our Mission",
    image: "/uploads/company/mission.png",
    alt: "Nguvu Mining Mission - Committed to rejuvenating, expanding, and operating medium-sized mining assets in Africa by undertaking responsible brownfield and greenfield exploration using local and regional resources.",
  },
  {
    id: "values",
    title: "Our Values",
    image: "/uploads/company/values.png",
    alt: "Nguvu Mining Values - Integrity, Teamwork, Duty of Care, Accountability, Respect",
  },
];

export interface CompanyImages {
  visionImage?: string;
  missionImage?: string;
  valuesImage?: string;
}

interface CompanyValuesSlideshowProps {
  images?: CompanyImages;
  autoPlayInterval?: number;
  className?: string;
}

// Helper to build slides from images
function buildSlides(images?: CompanyImages) {
  if (!images) return defaultSlides;

  return [
    {
      id: "vision",
      title: "Our Vision",
      image: images.visionImage || defaultSlides[0].image,
      alt: defaultSlides[0].alt,
    },
    {
      id: "mission",
      title: "Our Mission",
      image: images.missionImage || defaultSlides[1].image,
      alt: defaultSlides[1].alt,
    },
    {
      id: "values",
      title: "Our Values",
      image: images.valuesImage || defaultSlides[2].image,
      alt: defaultSlides[2].alt,
    },
  ];
}

export function CompanyValuesSlideshow({
  images,
  autoPlayInterval = 6000,
  className = "",
}: CompanyValuesSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = buildSlides(images);

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlayInterval, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  const currentSlideData = slides[currentSlide];

  return (
    <Card className={`overflow-hidden shadow-lg ${className}`}>
      <div className="relative">
        {/* Main Image */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-gray-900">
          <img
            key={currentSlideData.id}
            src={currentSlideData.image}
            alt={currentSlideData.alt}
            className="w-full h-full object-contain sm:object-cover"
          />
        </div>

        {/* Navigation Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-2 sm:p-3 text-white transition-colors z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-2 sm:p-3 text-white transition-colors z-10"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide
                  ? "w-8 bg-primary-500"
                  : "w-2 bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Go to ${slide.title}`}
            />
          ))}
        </div>

        {/* Title Labels */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {slides.map((slide, idx) => (
            <Button
              key={slide.id}
              size="sm"
              variant={idx === currentSlide ? "solid" : "flat"}
              color={idx === currentSlide ? "primary" : "default"}
              className={
                idx === currentSlide
                  ? "font-semibold"
                  : "bg-black/40 text-white hover:bg-black/60"
              }
              onPress={() => setCurrentSlide(idx)}
            >
              {slide.title}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Export the default slides for use in homepage carousel (when no DB data available)
export const companySlides = defaultSlides;

// Export helper to build slides for external use
export { buildSlides };
