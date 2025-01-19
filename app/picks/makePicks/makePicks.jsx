import { getPickableGames, getCurrentWeek } from "@/utils/db";

import MakePicksForm from "./makePicksForm";

export default async function MakePicks() {
  /* On load, go get games from our database */
  const thisWeeksGames = await getPickableGames(await getCurrentWeek());

  return thisWeeksGames.length > 0 ? (
    <MakePicksForm games={thisWeeksGames} />
  ) : (
    <div>No games found</div>
  );
}
