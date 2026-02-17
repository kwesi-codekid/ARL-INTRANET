/**
 * Alert Toast Component
 * Auto-dismissing popup notifications for alerts
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Link } from "react-router";
import { playAlertSound } from "./alertSound";

interface AlertToastItem {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  type: string;
  playSound?: boolean;
}

interface AlertToastProps {
  alerts: AlertToastItem[];
  autoHideDuration?: number; // milliseconds, default 6000
}

const severityConfig = {
  critical: {
    bg: "bg-red-600",
    border: "border-red-700",
    icon: AlertTriangle,
    iconBg: "bg-red-700",
  },
  warning: {
    bg: "bg-amber-500",
    border: "border-amber-600",
    icon: AlertCircle,
    iconBg: "bg-amber-600",
  },
  info: {
    bg: "bg-blue-500",
    border: "border-blue-600",
    icon: Info,
    iconBg: "bg-blue-600",
  },
};

export function AlertToast({ alerts, autoHideDuration = 6000 }: AlertToastProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<AlertToastItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load dismissed alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dismissedToastAlerts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only keep dismissals from the last 24 hours
        const now = Date.now();
        const validDismissals = Object.entries(parsed)
          .filter(([, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000)
          .map(([id]) => id);
        setDismissedIds(new Set(validDismissals));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Play sound once when toast alerts with playSound first appear
  const playedSoundIds = useRef<Set<string>>(new Set());

  // Filter and show alerts that haven't been dismissed
  useEffect(() => {
    const newAlerts = alerts.filter((alert) => !dismissedIds.has(alert.id));
    // Play sound for newly visible alerts
    newAlerts.forEach((alert) => {
      if (alert.playSound && !playedSoundIds.current.has(alert.id)) {
        playedSoundIds.current.add(alert.id);
        playAlertSound(alert.severity);
      }
    });
    setVisibleAlerts(newAlerts);
  }, [alerts, dismissedIds]);

  // Auto-dismiss alerts after duration
  useEffect(() => {
    if (visibleAlerts.length === 0) return;

    const timers = visibleAlerts.map((alert) => {
      // Critical alerts stay longer
      const duration = alert.severity === "critical" ? autoHideDuration * 1.5 : autoHideDuration;
      return setTimeout(() => {
        handleDismiss(alert.id);
      }, duration);
    });

    return () => timers.forEach(clearTimeout);
  }, [visibleAlerts, autoHideDuration]);

  const handleDismiss = (alertId: string) => {
    setDismissedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(alertId);

      // Store with timestamp
      const stored = localStorage.getItem("dismissedToastAlerts");
      const existing = stored ? JSON.parse(stored) : {};
      existing[alertId] = Date.now();
      localStorage.setItem("dismissedToastAlerts", JSON.stringify(existing));

      return newSet;
    });
    setVisibleAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {visibleAlerts.slice(0, 3).map((alert, index) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`${config.bg} ${config.border} border rounded-lg shadow-lg overflow-hidden pointer-events-auto`}
            >
              <div className="flex items-start gap-3 p-3">
                <div className={`${config.iconBg} p-2 rounded-full flex-shrink-0`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{alert.title}</p>
                  <p className="text-white/80 text-xs mt-0.5 line-clamp-2">{alert.message}</p>
                  <Link
                    to={`/alerts/${alert.id}`}
                    className="text-xs text-white/90 hover:text-white underline mt-1 inline-block"
                  >
                    View details
                  </Link>
                </div>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-white/70 hover:text-white p-1 flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Progress bar for auto-dismiss */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{
                  duration: alert.severity === "critical" ? autoHideDuration * 1.5 / 1000 : autoHideDuration / 1000,
                  ease: "linear",
                }}
                className="h-1 bg-white/30"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default AlertToast;
