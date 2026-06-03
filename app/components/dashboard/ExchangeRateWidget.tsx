/**
 * Exchange Rate Widget — live USD -> GHS (Ghana Cedi) reference rate.
 * Data comes from /api/exchange-rate (open.er-api.com, cached server-side).
 *
 * Two variants, both styled for the dark navbar:
 *  - "compact": flag + rate for the header bar (all breakpoints).
 *  - "panel":   full readout (both directions + "as of") for the mobile menu.
 */

import { useEffect } from "react";
import { useFetcher } from "react-router";
import { DateTime } from "luxon";
import { DollarSign, ArrowRightLeft, Clock } from "lucide-react";

// Rate data shape returned by /api/exchange-rate.
interface RateData {
  usdToGhs: number;
  ghsToUsd: number;
  updatedAt: string | null;
  nextUpdateAt: string | null;
}

function formatAsOf(iso: string | null): string | null {
  if (!iso) return null;
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) return null;
  return dt.toFormat("ccc LLL dd, HH:mm");
}

interface ExchangeRateWidgetProps {
  /** "compact" for the navbar bar, "panel" for the mobile menu. */
  variant?: "compact" | "panel";
}

export function ExchangeRateWidget({ variant = "compact" }: ExchangeRateWidgetProps) {
  const rateFetcher = useFetcher<{ rate: RateData | null }>();

  useEffect(() => {
    rateFetcher.load("/api/exchange-rate");
    // Refresh hourly to match the server-side cache window.
    const interval = setInterval(
      () => rateFetcher.load("/api/exchange-rate"),
      3_600_000
    );
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rate = rateFetcher.data?.rate;
  // Render nothing while loading or if the fetch failed — keeps the bar clean.
  if (!rate) return null;

  const asOf = formatAsOf(rate.updatedAt);

  if (variant === "panel") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15">
            <DollarSign size={22} className="text-emerald-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tabular-nums">
                ₵{rate.usdToGhs.toFixed(2)}
              </span>
              <span className="text-sm text-white/70">per US$1</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/50">
              <ArrowRightLeft size={11} />
              <span className="tabular-nums">
                ₵1 = ${rate.ghsToUsd.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
        {asOf && (
          <div className="mt-2 flex items-center gap-1 border-t border-white/10 pt-2 text-[10px] text-white/40">
            <Clock size={10} />
            <span>As of {asOf}</span>
          </div>
        )}
      </div>
    );
  }

  // Compact navbar chip.
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5"
      title={`USD → GHS · ₵1 = $${rate.ghsToUsd.toFixed(4)}${
        asOf ? ` · As of ${asOf}` : ""
      }`}
    >
      <DollarSign size={16} className="shrink-0 text-emerald-300" />
      <span className="text-sm font-semibold text-white tabular-nums">
        ₵{rate.usdToGhs.toFixed(2)}
      </span>
      <span className="hidden text-xs text-white/60 xl:inline">USD/GHS</span>
    </div>
  );
}
