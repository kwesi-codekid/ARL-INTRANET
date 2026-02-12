/**
 * Gold Price Ticker - Compact TradingView Widget
 * Shows live gold (XAU/USD) price in the navbar - horizontal ticker
 */

import { Skeleton } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import goldBar from "~/asset/gold-bar.png";
import { DateTime } from "luxon";

interface GoldPriceTickerProps {
  className?: string;
}

export function GoldPriceTicker({ className = "" }: GoldPriceTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getLongDateFromTimestamp = (timestamp: number) => {
    // convert timestamp to Sun Feb 08 2026 15:50 format
    const date = DateTime.fromMillis(timestamp);
    return date.toFormat("ccc LLL dd yyyy HH:mm");
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchGoldPrice = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://data-asg.goldprice.org/dbXRates/USD"
      );
      const result = await response.json();

      if (response.ok) {
        setData(result);
        console.log("Data: ", result);
      }
    } catch (error) {
      console.error("Error fetching gold price:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGoldPrice();
    }, 60000); // Update every 60 seconds

    // Initial fetch
    fetchGoldPrice();

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <img src={goldBar} alt="Gold Price" className="w-8" />
        <div className="flex-1">
          <Skeleton className="dark h-4 w-16 rounded-md" />
          <Skeleton className="dark mt-1 h-1 w-20 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img src={goldBar} alt="Gold Price" className="w-8" />
      <div className="flex-1">
        <div className="-mb-2 flex items-center gap-2">
          <p className="text-sm text-[#d2ab67]">${data?.items[0].xauPrice}</p>
          <p className="text-sm text-green-500">
            ▲+{data?.items[0].chgXau?.toFixed(2)} +
            {data?.items[0].pcXau?.toFixed(2)}%
          </p>
        </div>
        <p className="text-[8px] text-white">
          Gold Price last updated on{" "}
          {data && getLongDateFromTimestamp(data?.ts)}
        </p>
      </div>
    </div>
  );
}
