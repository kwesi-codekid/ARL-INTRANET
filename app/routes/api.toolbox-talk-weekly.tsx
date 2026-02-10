/**
 * Weekly PSI Talk API
 * Returns the current week's PSI talk for sidebar widget
 */

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { connectDB } = await import("~/lib/db/connection.server");
  const { getThisWeeksToolboxTalk, getWeekDateRange, serializeToolboxTalk } = await import(
    "~/lib/services/toolbox-talk.server"
  );

  await connectDB();

  const weeksTalk = await getThisWeeksToolboxTalk();
  const weekRange = getWeekDateRange();

  return Response.json({
    talk: weeksTalk ? serializeToolboxTalk(weeksTalk) : null,
    weekRange: {
      start: weekRange.start.toISOString(),
      end: weekRange.end.toISOString(),
    },
  });
}
