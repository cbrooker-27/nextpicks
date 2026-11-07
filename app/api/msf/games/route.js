import { auth } from "@/auth";
import { getGamesForWeekFromMsfWithStatus } from "@/app/lib/msf";
import { getMsfWeek } from "../period";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const week = getMsfWeek(request);
  if (!week) {
    return Response.json({ error: "A valid season and week are required." }, { status: 400 });
  }

  return Response.json(await getGamesForWeekFromMsfWithStatus(week));
}
