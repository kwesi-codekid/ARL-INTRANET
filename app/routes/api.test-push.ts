import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { sendPushNotificationToAll } = await import(
    "~/lib/services/push-notification.server"
  );

  sendPushNotificationToAll({
    title: "Test Notification",
    body: "If you see this, push notifications are working!",
    url: "/",
  });

  return Response.json({ sent: true, timestamp: new Date().toISOString() });
}
