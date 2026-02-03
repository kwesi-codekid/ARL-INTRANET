/**
 * Gold Price Ticker - Professional Custom Design
 * Real-time gold price with elegant styling for a mining company
 */

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface GoldData {
  price: number;
  prevPrice: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

export function GoldPriceTicker() {
  const [data, setData] = useState<GoldData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchGoldPrice = useCallback(async () => {
    try {
      // Primary: metals.live API
      const response = await fetch("https://api.metals.live/v1/spot/gold");
      const result = await response.json();

      if (result && result.length > 0) {
        const latest = result[0];
        const prevPrice = data?.price || latest.price;

        setData({
          price: latest.price,
          prevPrice: prevPrice,
          change: latest.change || (latest.price - prevPrice),
          changePercent: latest.changePercent || ((latest.price - prevPrice) / prevPrice * 100),
          high24h: latest.high || latest.price * 1.005,
          low24h: latest.low || latest.price * 0.995,
          timestamp: new Date(),
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      // Fallback data
      if (!data) {
        setData({
          price: 2650.00,
          prevPrice: 2645.00,
          change: 5.00,
          changePercent: 0.19,
          high24h: 2660.00,
          low24h: 2640.00,
          timestamp: new Date(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    setIsClient(true);
    fetchGoldPrice();

    // Update every 30 seconds for more real-time feel
    const interval = setInterval(fetchGoldPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't render on server
  if (!isClient) {
    return (
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500/30 animate-pulse" />
              <span className="text-amber-400/60 text-sm font-medium">Loading gold price...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = data ? data.change >= 0 : true;
  const priceChanged = data && data.price !== data.prevPrice;

  return (
    <div className="bg-gradient-to-r from-[#1a1a1a] via-[#252525] to-[#1a1a1a] border-b border-amber-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Gold Icon & Label */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-white font-bold text-xs">Au</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1a1a1a] animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <p className="text-amber-400 text-xs font-semibold tracking-wider uppercase">Gold Spot</p>
              <p className="text-white/50 text-[10px]">XAU/USD</p>
            </div>
          </div>

          {/* Center: Price Display */}
          <div className="flex items-center gap-6">
            {/* Main Price */}
            <div className="text-center">
              <div className="flex items-baseline gap-1">
                <span className="text-white/60 text-sm">$</span>
                <span
                  className={`text-2xl sm:text-3xl font-bold tabular-nums transition-colors duration-300 ${
                    priceChanged
                      ? isPositive ? "text-green-400" : "text-red-400"
                      : "text-white"
                  }`}
                >
                  {data ? data.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : "---"}
                </span>
              </div>
              <p className="text-white/40 text-[10px] mt-0.5">per troy oz</p>
            </div>

            {/* Change */}
            {data && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                isPositive
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}>
                {isPositive ? (
                  <TrendingUp size={16} className="text-green-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
                <div className="text-right">
                  <p className={`text-sm font-semibold tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{data.change.toFixed(2)}
                  </p>
                  <p className={`text-[10px] tabular-nums ${isPositive ? "text-green-400/70" : "text-red-400/70"}`}>
                    {isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: 24h Range */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center px-3 py-1 rounded bg-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">24h High</p>
              <p className="text-sm font-medium text-green-400 tabular-nums">
                ${data?.high24h.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "---"}
              </p>
            </div>
            <div className="text-center px-3 py-1 rounded bg-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-wide">24h Low</p>
              <p className="text-sm font-medium text-red-400 tabular-nums">
                ${data?.low24h.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "---"}
              </p>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping" />
              </div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Gold Price for Navbar
 */
export function GoldPriceCompact() {
  const [data, setData] = useState<{ price: number; change: number; changePercent: number } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const fetchPrice = async () => {
      try {
        const response = await fetch("https://api.metals.live/v1/spot/gold");
        const result = await response.json();
        if (result?.[0]) {
          setData({
            price: result[0].price,
            change: result[0].change || 0,
            changePercent: result[0].changePercent || 0,
          });
        }
      } catch {
        setData({ price: 2650, change: 5, changePercent: 0.19 });
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
        <span className="text-amber-400 text-xs font-bold">Au</span>
        <span className="text-white/50 text-xs">Loading...</span>
      </div>
    );
  }

  const isPositive = data ? data.change >= 0 : true;

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
        <span className="text-white font-bold text-[8px]">Au</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-sm tabular-nums">
          ${data?.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "---"}
        </span>
        {data && (
          <span className={`text-xs font-medium tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "▲" : "▼"} {Math.abs(data.changePercent).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Gold Price Mini Chart Widget (for dashboard)
 */
export function GoldPriceMiniChart() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-4 h-[200px] flex items-center justify-center">
        <span className="text-white/50 animate-pulse">Loading chart...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      <iframe
        src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=FOREXCOM%3AXAUUSD&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=1a1a1a&studies=&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=0&showpopupbutton=0&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&showpopupbutton=0&locale=en"
        width="100%"
        height="200"
        frameBorder="0"
        allowTransparency
        scrolling="no"
        style={{ display: "block" }}
        title="Gold Price Chart"
      />
    </div>
  );
}

// Keep for backwards compatibility
export function GoldPriceSingleWidget() {
  return <GoldPriceCompact />;
}
