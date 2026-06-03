/**
 * Exchange Rate API Route
 * Provides the latest USD -> GHS (Ghana Cedi) reference rate for the navbar widget.
 * Source: open.er-api.com (free, no API key required).
 *
 * Note: the free feed publishes a daily reference rate, not a tick-by-tick
 * interbank rate — the payload includes the "as of" / "next update" timestamps
 * so the client can be honest about freshness.
 *
 * Returns a compact, already-rounded payload so the client just renders it.
 * Results are cached in-process to avoid hitting the upstream on every page load.
 */

import type { LoaderFunctionArgs } from "react-router";

const RATE_SOURCE = "https://open.er-api.com/v6/latest/USD";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (upstream only refreshes daily)

interface ExchangeRatePayload {
  rate: {
    /** Cedis per 1 US dollar, e.g. 11.78. */
    usdToGhs: number;
    /** US dollars per 1 cedi, e.g. 0.0849. */
    ghsToUsd: number;
    /** ISO timestamp the upstream rate was published. */
    updatedAt: string | null;
    /** ISO timestamp the upstream expects to next refresh. */
    nextUpdateAt: string | null;
  } | null;
}

// Module-level cache (persists across requests in the server process).
let cache: { data: ExchangeRatePayload; expires: number } | null = null;

interface ErApiResponse {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
  time_next_update_utc?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Serve from cache when fresh.
  if (cache && cache.expires > Date.now()) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  try {
    const res = await fetch(RATE_SOURCE, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`open.er-api.com responded ${res.status}`);

    const data = (await res.json()) as ErApiResponse;
    const ghs = data.rates?.GHS;
    if (data.result !== "success" || typeof ghs !== "number") {
      throw new Error("Missing GHS rate in response");
    }

    const toIso = (utc?: string) => {
      if (!utc) return null;
      const ms = Date.parse(utc);
      return Number.isNaN(ms) ? null : new Date(ms).toISOString();
    };

    const payload: ExchangeRatePayload = {
      rate: {
        usdToGhs: Math.round(ghs * 100) / 100, // 2dp
        ghsToUsd: Math.round((1 / ghs) * 10000) / 10000, // 4dp
        updatedAt: toIso(data.time_last_update_utc),
        nextUpdateAt: toIso(data.time_next_update_utc),
      },
    };

    cache = { data: payload, expires: Date.now() + CACHE_TTL_MS };

    return Response.json(payload, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    console.error("[api/exchange-rate] Failed to fetch rate:", error);
    // Fail soft: serve stale cache if we have any, otherwise null.
    if (cache) {
      return Response.json(cache.data, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }
    return Response.json({ rate: null } satisfies ExchangeRatePayload, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
