/**
 * Alert Banner Component
 * Task: 1.2.3.2.1 - Create alert banner component (top of page)
 * Task: 1.2.3.2.3 - Implement severity-based styling
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/react";
import { X, AlertTriangle, AlertCircle, Info, Volume2 } from "lucide-react";
import type { SerializedAlert } from "~/lib/services/alert.server";
import { playAlertSound } from "./alertSound";

interface AlertBannerProps {
  alerts: SerializedAlert[];
  onDismiss?: (alertId: string) => void;
}

const severityConfig = {
  critical: {
    bg: "bg-red-600",
    text: "text-white",
    icon: AlertTriangle,
    iconColor: "text-white",
  },
  warning: {
    bg: "bg-amber-500",
    text: "text-white",
    icon: AlertCircle,
    iconColor: "text-white",
  },
  info: {
    bg: "bg-blue-500",
    text: "text-white",
    icon: Info,
    iconColor: "text-white",
  },
};

export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dismissedBannerAlerts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedAlerts(new Set(parsed));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(
    (alert) => alert.showBanner && !dismissedAlerts.has(alert.id)
  );

  // Play sound once when banner alerts with playSound first appear
  const playedSoundIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    visibleAlerts.forEach((alert) => {
      if (alert.playSound && !playedSoundIds.current.has(alert.id)) {
        playedSoundIds.current.add(alert.id);
        playAlertSound(alert.severity);
      }
    });
  }, [visibleAlerts]);

  // Auto-rotate alerts every 5 seconds
  useEffect(() => {
    if (visibleAlerts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleAlerts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [visibleAlerts.length]);

  const handleDismiss = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
    localStorage.setItem(
      "dismissedBannerAlerts",
      JSON.stringify(Array.from(newDismissed))
    );
    onDismiss?.(alertId);
  };

  if (visibleAlerts.length === 0) return null;

  const currentAlert = visibleAlerts[currentIndex % visibleAlerts.length];
  if (!currentAlert) return null;

  const config = severityConfig[currentAlert.severity];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.text} py-2 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon size={20} className={config.iconColor} />
          <div className="flex-1 min-w-0">
            <span className="font-semibold mr-2">{currentAlert.title}:</span>
            <span className="truncate">{currentAlert.message}</span>
          </div>
          {currentAlert.playSound && (
            <Volume2 size={16} className="opacity-75 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {visibleAlerts.length > 1 && (
            <span className="text-xs opacity-75">
              {currentIndex + 1} / {visibleAlerts.length}
            </span>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className={config.text}
            onPress={() => handleDismiss(currentAlert.id)}
            aria-label="Dismiss alert"
          >
            <X size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AlertBanner;
