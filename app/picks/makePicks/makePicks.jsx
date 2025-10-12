import { getPickableGames, getCurrentWeek, getThisWeeksPickedGames, getAllGames } from "@/app/utils/db";

import MakePicksForm from "./makePicksForm";
import { auth, signIn } from "@/auth";
import { getTeamStatisticsFromMsf } from "@/app/lib/msf.js";
import { SeasonStatisticsProvider } from "@/app/context/SeasonStatistics";

export default async function MakePicks() {
  const session = await auth();

  // if user is not authenticated, send them to sign in
  if (!session?.user) {
    await signIn(null, { redirectTo: "/picks/makePicks" });
  }
  /* On load, go get games from our database */
  const week = await getCurrentWeek();
  const thisWeeksPicksString = await getThisWeeksPickedGames();
  const teamDetails = await getTeamStatisticsFromMsf(week);
  const seasonData = await getAllGames(week.season);
  if (thisWeeksPicksString) {
    const thisWeeksPicks = JSON.parse(thisWeeksPicksString);
    if (thisWeeksPicks.some((pick) => pick.userChoices.some((choice) => choice.userId === session.user.name))) {
      // User has already made picks for this week
      return <div>You have already made your picks for this week.</div>;
    }

    const thisWeeksGames = await getPickableGames(week);

    return thisWeeksGames.length > 0 ? (
      <SeasonStatisticsProvider value={{ seasonData }}>
        <MakePicksForm games={thisWeeksGames} teamDetails={teamDetails} />
      </SeasonStatisticsProvider>
    ) : (
      <div>No games found</div>
    );
  }
}
