import { getPickableGames, getCurrentWeek, getThisWeeksPickedGames } from "@/app/utils/db";

import MakePicksForm from "./makePicksForm";
import { auth, signIn } from "@/auth";
import { getTeamStatisticsFromMsf } from "@/app/lib/msf";

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
  if (thisWeeksPicksString) {
    const thisWeeksPicks = JSON.parse(thisWeeksPicksString);
    if (thisWeeksPicks.some((pick) => pick.userChoices.some((choice) => choice.userId === session.user.name))) {
      // User has already made picks for this week
      return <div>You have already made your picks for this week.</div>;
    }

    const thisWeeksGames = await getPickableGames(week);

    return thisWeeksGames.length > 0 ? (
      <MakePicksForm games={thisWeeksGames} teamDetails={teamDetails} />
    ) : (
      <div>No games found</div>
    );
  }
}
