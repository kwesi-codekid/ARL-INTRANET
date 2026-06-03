/**
 * Weather Widget — live conditions for the ARL mine site.
 * Data comes from /api/weather (Open-Meteo, cached server-side).
 *
 * Two variants, both styled for the dark navbar:
 *  - "compact": icon + temperature for the header bar (all breakpoints).
 *  - "panel":   full readout (feels-like, humidity, rain) for the mobile menu.
 */

import { useEffect } from "react";
import { useFetcher } from "react-router";
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  Droplets,
  Thermometer,
  MapPin,
} from "lucide-react";

// Weather data shape returned by /api/weather.
interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  rainChance: number | null;
  humidity: number;
  condition: string;
  icon: string;
  isDay: boolean;
  location: string;
  updatedAt: string;
}

// Map the API's icon key -> a lucide icon, with day/night variants.
const weatherIcons: Record<string, { day: typeof Sun; night: typeof Sun }> = {
  clear: { day: Sun, night: Moon },
  "partly-cloudy": { day: CloudSun, night: CloudMoon },
  cloudy: { day: Cloud, night: Cloud },
  fog: { day: CloudFog, night: CloudFog },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle },
  rain: { day: CloudRain, night: CloudRain },
  snow: { day: Snowflake, night: Snowflake },
  thunderstorm: { day: CloudLightning, night: CloudLightning },
};

function resolveIcon(weather: WeatherData) {
  const iconSet = weatherIcons[weather.icon] || weatherIcons.cloudy;
  return weather.isDay ? iconSet.day : iconSet.night;
}

interface WeatherWidgetProps {
  /** "compact" for the navbar bar, "panel" for the mobile menu. */
  variant?: "compact" | "panel";
}

export function WeatherWidget({ variant = "compact" }: WeatherWidgetProps) {
  const weatherFetcher = useFetcher<{ weather: WeatherData | null }>();

  useEffect(() => {
    weatherFetcher.load("/api/weather");
    // Refresh every 10 minutes to match the server-side cache window.
    const interval = setInterval(() => weatherFetcher.load("/api/weather"), 600_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weather = weatherFetcher.data?.weather;
  // Render nothing while loading or if the fetch failed — keeps the bar clean.
  if (!weather) return null;

  const WeatherIcon = resolveIcon(weather);

  if (variant === "panel") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <WeatherIcon size={28} className="shrink-0 text-amber-300" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tabular-nums">
                {weather.temperature}°C
              </span>
              <span className="text-sm text-white/70">{weather.condition}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/50">
              <span className="flex items-center gap-1">
                <Thermometer size={11} /> Feels {weather.apparentTemperature}°
              </span>
              <span className="flex items-center gap-1">
                <Droplets size={11} /> {weather.humidity}% humidity
              </span>
              {weather.rainChance !== null && (
                <span className="flex items-center gap-1">
                  <CloudRain size={11} /> {weather.rainChance}% rain
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 border-t border-white/10 pt-2 text-[10px] text-white/40">
          <MapPin size={10} />
          <span>{weather.location}</span>
        </div>
      </div>
    );
  }

  // Compact navbar chip.
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5"
      title={`${weather.condition} · ${weather.location} · Feels ${weather.apparentTemperature}° · Humidity ${weather.humidity}%${
        weather.rainChance !== null ? ` · ${weather.rainChance}% rain` : ""
      }`}
    >
      <WeatherIcon size={18} className="shrink-0 text-amber-300" />
      <span className="text-sm font-semibold text-white tabular-nums">
        {weather.temperature}°
      </span>
      <span className="hidden text-xs text-white/60 xl:inline">
        {weather.condition}
      </span>
    </div>
  );
}
