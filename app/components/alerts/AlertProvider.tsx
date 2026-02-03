/**
 * Alert Provider Context
 * Task: 1.2.3.2.5 - Implement auto-display on page load for new alerts
 * Manages alert state across the application
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useFetcher } from "react-router";
import type { SerializedAlert } from "~/lib/services/alert.server";

interface AlertContextType {
  alerts: SerializedAlert[];
  bannerAlerts: SerializedAlert[];
  popupAlerts: SerializedAlert[];
  alertCount: number;
  isLoading: boolean;
  isPopupOpen: boolean;
  openPopup: () => void;
  closePopup: () => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissBannerAlert: (alertId: string) => void;
  refreshAlerts: () => void;
  getUnacknowledgedAlerts: () => SerializedAlert[];
}

const AlertContext = createContext<AlertContextType | null>(null);

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlerts must be used within an AlertProvider");
  }
  return context;
}

// Safe version that returns null instead of throwing when used outside AlertProvider
export function useAlertsSafe(): AlertContextType | null {
  return useContext(AlertContext);
}

// Storage keys
const ACKNOWLEDGED_KEY = "acknowledgedAlerts";
const DISMISSED_BANNER_KEY = "dismissedBannerAlerts";
const POPUP_SHOWN_KEY = "alertPopupShownIds";

interface AlertProviderProps {
  children: ReactNode;
  initialAlerts?: SerializedAlert[];
  initialCount?: number;
}

export function AlertProvider({
  children,
  initialAlerts = [],
  initialCount = 0,
}: AlertProviderProps) {
  const [alerts, setAlerts] = useState<SerializedAlert[]>(initialAlerts);
  const [alertCount, setAlertCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [dismissedBannerIds, setDismissedBannerIds] = useState<Set<string>>(new Set());
  const [popupShownIds, setPopupShownIds] = useState<Set<string>>(new Set());
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  const fetcher = useFetcher();

  // Load persisted state from localStorage
  useEffect(() => {
    const acknowledged = localStorage.getItem(ACKNOWLEDGED_KEY);
    const dismissedBanner = localStorage.getItem(DISMISSED_BANNER_KEY);
    const popupShown = localStorage.getItem(POPUP_SHOWN_KEY);

    if (acknowledged) {
      try {
        setAcknowledgedIds(new Set(JSON.parse(acknowledged)));
      } catch {
        // Ignore parse errors
      }
    }

    if (dismissedBanner) {
      try {
        setDismissedBannerIds(new Set(JSON.parse(dismissedBanner)));
      } catch {
        // Ignore parse errors
      }
    }

    if (popupShown) {
      try {
        // Parse and filter to keep only IDs from last 24 hours
        const parsed = JSON.parse(popupShown);
        const now = Date.now();
        const validIds = Object.entries(parsed)
          .filter(([, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000)
          .map(([id]) => id);
        setPopupShownIds(new Set(validIds));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Fetch alerts on mount
  useEffect(() => {
    refreshAlerts();
  }, []);

  // Update alerts when fetcher completes
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data as { alerts?: SerializedAlert[]; count?: number };
      if (data.alerts) {
        setAlerts(data.alerts);
        setAlertCount(data.alerts.length);
        setIsLoading(false);
      }
    }
  }, [fetcher.data, fetcher.state]);

  // Auto-display popup for new alerts on page load
  useEffect(() => {
    if (hasCheckedInitial || alerts.length === 0) return;

    const unshownPopupAlerts = alerts.filter(
      (alert) =>
        alert.showPopup &&
        !acknowledgedIds.has(alert.id) &&
        !popupShownIds.has(alert.id)
    );

    if (unshownPopupAlerts.length > 0) {
      // Mark these alerts as shown
      const newShownIds = new Set(popupShownIds);
      const stored: Record<string, number> = {};

      unshownPopupAlerts.forEach((alert) => {
        newShownIds.add(alert.id);
        stored[alert.id] = Date.now();
      });

      // Merge with existing stored data
      const existingStored = localStorage.getItem(POPUP_SHOWN_KEY);
      if (existingStored) {
        try {
          Object.assign(stored, JSON.parse(existingStored));
        } catch {
          // Ignore parse errors
        }
      }

      setPopupShownIds(newShownIds);
      localStorage.setItem(POPUP_SHOWN_KEY, JSON.stringify(stored));

      // Open the popup after a short delay
      setTimeout(() => {
        setIsPopupOpen(true);
      }, 500);
    }

    setHasCheckedInitial(true);
  }, [alerts, acknowledgedIds, popupShownIds, hasCheckedInitial]);

  const refreshAlerts = useCallback(() => {
    setIsLoading(true);
    fetcher.load("/api/alerts?mode=active");
  }, [fetcher]);

  const openPopup = useCallback(() => {
    setIsPopupOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAcknowledgedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      localStorage.setItem(ACKNOWLEDGED_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });

    // Also send acknowledgment to server
    const visitorId = getVisitorId();
    fetcher.submit(
      { intent: "acknowledge", alertId, visitorId },
      { method: "POST", action: "/api/alerts" }
    );
  }, [fetcher]);

  const dismissBannerAlert = useCallback((alertId: string) => {
    setDismissedBannerIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      localStorage.setItem(DISMISSED_BANNER_KEY, JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);

  const getUnacknowledgedAlerts = useCallback(() => {
    return alerts.filter(
      (alert) => alert.showPopup && !acknowledgedIds.has(alert.id)
    );
  }, [alerts, acknowledgedIds]);

  // Filter alerts for banner (not dismissed)
  const bannerAlerts = alerts.filter(
    (alert) => alert.showBanner && !dismissedBannerIds.has(alert.id)
  );

  // Filter alerts for popup (not acknowledged)
  const popupAlerts = alerts.filter(
    (alert) => alert.showPopup && !acknowledgedIds.has(alert.id)
  );

  return (
    <AlertContext.Provider
      value={{
        alerts,
        bannerAlerts,
        popupAlerts,
        alertCount: bannerAlerts.length + popupAlerts.length,
        isLoading,
        isPopupOpen,
        openPopup,
        closePopup,
        acknowledgeAlert,
        dismissBannerAlert,
        refreshAlerts,
        getUnacknowledgedAlerts,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

// Generate a unique visitor ID for tracking acknowledgments
function getVisitorId(): string {
  const storageKey = "alertVisitorId";
  let visitorId = localStorage.getItem(storageKey);

  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, visitorId);
  }

  return visitorId;
}

export default AlertProvider;
