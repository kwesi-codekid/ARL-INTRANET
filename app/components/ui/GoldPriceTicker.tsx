/**
 * Gold Price Ticker - Compact TradingView Widget
 * Shows live gold (XAU/USD) price in the navbar - horizontal ticker
 */

import { useEffect, useRef } from "react";

interface GoldPriceTickerProps {
  className?: string;
}


export function GoldPriceTicker({ className = "" }: GoldPriceTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = "";

    // Create the TradingView widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetContainer.appendChild(widgetDiv);

    // Create and append the script - using single quote widget (horizontal)
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: "OANDA:XAUUSD",
      width: "100%",
      isTransparent: true,
      colorTheme: "dark",
      locale: "en"
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`gold-ticker ${className}`}
      style={{
        width: "200px",
        height: "46px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    />
  );
}
