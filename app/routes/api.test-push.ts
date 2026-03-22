import type { LoaderFunctionArgs } from "react-router";
import { sendPushNotificationToAll } from "~/lib/services/push-notification.server";

export async function loader({ request }: LoaderFunctionArgs) {
  sendPushNotificationToAll({
    title: "Test Notification",
    body: "If you see this, push notifications are working!",
    url: "/",
  });

  return Response.json({ sent: true, timestamp: new Date().toISOString() });
}
