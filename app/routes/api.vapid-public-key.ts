import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { getVapidPublicKey } = await import(
    "~/lib/services/push-notification.server"
  );

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return Response.json({ error: "Push notifications not configured" }, { status: 503 });
  }

  return Response.json({ publicKey });
}
