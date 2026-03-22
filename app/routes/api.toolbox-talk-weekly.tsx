/**
 * Weekly PSI Talk API
 * Returns the current week's PSI talk for sidebar widget
 */

import type { LoaderFunctionArgs } from "react-router";
import { connectDB } from "~/lib/db/connection.server";
import { getThisWeeksToolboxTalk, getWeekDateRange, serializeToolboxTalk } from "~/lib/services/toolbox-talk.server";

export async function loader({ request }: LoaderFunctionArgs) {
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
