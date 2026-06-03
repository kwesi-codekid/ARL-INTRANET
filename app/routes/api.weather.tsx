/**
 * Weather API Route
 * Provides current conditions for the ARL mine site (greeting-banner widget).
 * Source: Open-Meteo (free, no API key required).
 *
 * Returns a compact, already-rounded payload so the client just renders it.
 * Results are cached in-process for a few minutes to avoid hitting the
 * upstream on every page load.
 */

import type { LoaderFunctionArgs } from "react-router";

// Adamus / Nzema Gold Mine — Teleku Bokazo, Ellembelle District, Western Region, Ghana.
// Change these if the reported location should move.
const MINE_LOCATION = {
  latitude: 5.05,
  longitude: -2.38,
  timezone: "Africa/Accra",
  label: "Nzema Mine Site",
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Map WMO weather codes to a human label + an icon key the client understands.
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
function describeWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Clear sky", icon: "clear" };
  if (code === 1) return { condition: "Mainly clear", icon: "clear" };
  if (code === 2) return { condition: "Partly cloudy", icon: "partly-cloudy" };
  if (code === 3) return { condition: "Overcast", icon: "cloudy" };
  if (code === 45 || code === 48) return { condition: "Fog", icon: "fog" };
  if (code >= 51 && code <= 57) return { condition: "Drizzle", icon: "drizzle" };
  if (code >= 61 && code <= 67) return { condition: "Rain", icon: "rain" };
  if (code >= 71 && code <= 77) return { condition: "Snow", icon: "snow" };
  if (code >= 80 && code <= 82) return { condition: "Rain showers", icon: "rain" };
  if (code === 85 || code === 86) return { condition: "Snow showers", icon: "snow" };
  if (code === 95) return { condition: "Thunderstorm", icon: "thunderstorm" };
  if (code === 96 || code === 99)
    return { condition: "Thunderstorm with hail", icon: "thunderstorm" };
  return { condition: "Unknown", icon: "cloudy" };
}

interface WeatherPayload {
  weather: {
    temperature: number;
    apparentTemperature: number;
    rainChance: number | null;
    humidity: number;
    condition: string;
    icon: string;
    isDay: boolean;
    location: string;
    updatedAt: string;
  } | null;
}

// Module-level cache (persists across requests in the server process).
let cache: { data: WeatherPayload; expires: number } | null = null;

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    relative_humidity_2m: number;
    is_day: number;
  };
  hourly?: {
    time: string[];
    precipitation_probability: number[];
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Serve from cache when fresh.
  if (cache && cache.expires > Date.now()) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  }

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${MINE_LOCATION.latitude}` +
    `&longitude=${MINE_LOCATION.longitude}` +
    "&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,is_day" +
    "&hourly=precipitation_probability" +
    "&forecast_days=1" +
    `&timezone=${encodeURIComponent(MINE_LOCATION.timezone)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);

    const data = (await res.json()) as OpenMeteoResponse;
    const current = data.current;
    if (!current) throw new Error("Missing current weather in response");

    // Current-hour rain chance: match the current hour against the hourly series.
    let rainChance: number | null = null;
    if (data.hourly?.time && data.hourly.precipitation_probability) {
      const hourKey = current.time.slice(0, 13); // "YYYY-MM-DDTHH"
      const idx = data.hourly.time.findIndex((t) => t.startsWith(hourKey));
      if (idx >= 0) rainChance = Math.round(data.hourly.precipitation_probability[idx]);
    }

    const { condition, icon } = describeWeatherCode(current.weather_code);

    const payload: WeatherPayload = {
      weather: {
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature),
        rainChance,
        humidity: Math.round(current.relative_humidity_2m),
        condition,
        icon,
        isDay: current.is_day === 1,
        location: MINE_LOCATION.label,
        updatedAt: new Date().toISOString(),
      },
    };

    cache = { data: payload, expires: Date.now() + CACHE_TTL_MS };

    return Response.json(payload, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  } catch (error) {
    console.error("[api/weather] Failed to fetch weather:", error);
    // Fail soft: serve stale cache if we have any, otherwise null.
    if (cache) {
      return Response.json(cache.data, {
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }
    return Response.json({ weather: null } satisfies WeatherPayload, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
