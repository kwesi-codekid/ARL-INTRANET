import { createRequire } from "node:module";
import { connectDB } from "~/lib/db/connection.server";
import { PushSubscription } from "~/lib/db/models/push-subscription.server";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Use createRequire for reliable CJS module loading in Vite's SSR context
const require = createRequire(import.meta.url);
const webpush = require("web-push") as typeof import("web-push");

let vapidConfigured = false;

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@arl.com";

  if (!publicKey || !privateKey) {
    console.log("[Push] VAPID keys not configured, skipping");
    return false;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export async function saveSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
}) {
  await connectDB();

  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      ...(subscription.userId && { userId: subscription.userId }),
    },
    { upsert: true, new: true }
  );
}

export async function removeSubscription(endpoint: string) {
  await connectDB();
  await PushSubscription.deleteOne({ endpoint });
}

export function sendPushNotificationToAll(payload: PushPayload) {
  _sendToAll(payload).catch((err) => {
    console.error("[Push] sendPushNotificationToAll failed:", err);
  });
}

async function _sendToAll(payload: PushPayload) {
  if (!configureWebPush()) return;

  await connectDB();
  const subscriptions = await PushSubscription.find().lean();

  console.log("[Push] Sending to", subscriptions.length, "subscribers");

  if (subscriptions.length === 0) {
    console.log("[Push] No subscribers found");
    return;
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
  });

  const staleEndpoints: string[] = [];
  let successCount = 0;
  let errorCount = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          notificationPayload
        );
        successCount++;
      } catch (err: unknown) {
        errorCount++;
        const error = err as { statusCode?: number; body?: string };
        console.error(
          "[Push] Failed for:",
          sub.endpoint.substring(0, 60) + "...",
          "status:",
          error.statusCode
        );
        if (error.statusCode === 410 || error.statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  console.log(
    `[Push] Done: ${successCount} sent, ${errorCount} failed, ${staleEndpoints.length} stale`
  );

  if (staleEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: staleEndpoints } });
    console.log("[Push] Cleaned", staleEndpoints.length, "stale subscriptions");
  }
}
