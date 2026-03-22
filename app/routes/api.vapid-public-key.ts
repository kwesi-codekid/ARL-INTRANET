import type { LoaderFunctionArgs } from "react-router";
import { getVapidPublicKey } from "~/lib/services/push-notification.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return Response.json({ error: "Push notifications not configured" }, { status: 503 });
  }

  return Response.json({ publicKey });
}
