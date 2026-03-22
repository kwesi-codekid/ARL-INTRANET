import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  const { saveSubscription, removeSubscription } = await import(
    "~/lib/services/push-notification.server"
  );

  const body = await request.json();
  const { intent } = body;

  if (intent === "subscribe") {
    const { subscription } = body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await saveSubscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });

    return Response.json({ success: true });
  }

  if (intent === "unsubscribe") {
    const { endpoint } = body;
    if (!endpoint) {
      return Response.json({ error: "Endpoint required" }, { status: 400 });
    }

    await removeSubscription(endpoint);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid intent" }, { status: 400 });
}
