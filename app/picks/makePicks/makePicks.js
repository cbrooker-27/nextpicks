import { getPickableGames } from "@/lib/db";

import MakePicksForm from "./makePicksForm";

export default async function MakePicks(){
    /* On load, go get games from our database */
    const thisWeeksGames = await getPickableGames(14);

    return (<MakePicksForm games={thisWeeksGames}/>
      );
}