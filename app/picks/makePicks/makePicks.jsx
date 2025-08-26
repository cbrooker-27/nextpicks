import { getPickableGames, getCurrentWeek } from "@/utils/db";

import MakePicksForm from "./makePicksForm";

export default async function MakePicks() {
  /* On load, go get games from our database */
  const thisWeeksGames = await getPickableGames(await getCurrentWeek());
  const sortedGames = thisWeeksGames.sort((a, b) => a._id - b._id);

  return sortedGames.length > 0 ? <MakePicksForm games={sortedGames} /> : <div>No games found</div>;
}
