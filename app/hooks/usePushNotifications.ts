import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "push-notification-dismissed";
const DISMISS_DAYS = 30;

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const dismissedAt = parseInt(dismissed, 10);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
}

export function usePushNotifications() {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    const check = async () => {
      const permission = Notification.permission;

      if (permission === "denied") return;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (existing) {
        // Always sync existing subscription to server DB (may have been cleaned)
        await syncSubscription(existing);
        setIsSubscribed(true);
        return;
      }

      // Permission granted but no subscription (e.g. cleared data) — auto-resubscribe
      if (permission === "granted") {
        await subscribeQuietly(registration);
        return;
      }

      // Permission is "default" (never asked) — show prompt if not dismissed
      if (permission === "default" && !isDismissed()) {
        setShouldPrompt(true);
      }
    };

    check();
  }, []);

  const syncSubscription = async (subscription: PushSubscription) => {
    try {
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "subscribe",
          subscription: subscription.toJSON(),
        }),
      });
    } catch {
      // Silently fail — subscription will be synced on next page load
    }
  };

  const subscribeQuietly = async (registration: ServiceWorkerRegistration) => {
    try {
      const res = await fetch("/api/vapid-public-key");
      if (!res.ok) return;
      const { publicKey } = await res.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "subscribe",
          subscription: subscription.toJSON(),
        }),
      });

      setIsSubscribed(true);
      setShouldPrompt(false);
    } catch {
      // Silently fail
    }
  };

  const subscribe = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShouldPrompt(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      await subscribeQuietly(registration);
    } catch {
      // Silently fail
    }
  }, []);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShouldPrompt(false);
  }, []);

  return { shouldPrompt, isSubscribed, subscribe, dismissPrompt };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
