import { getPickableGames } from "@/utils/db";

import MakePicksForm from "./makePicksForm";

export default async function MakePicks() {
  /* On load, go get games from our database */
  const thisWeeksGames = await getPickableGames(12);

  return <MakePicksForm games={thisWeeksGames} />;
}
