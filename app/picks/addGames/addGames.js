import { getThisWeeksGames } from "@/lib/msf";
import AddGamesForm from "./addGamesForm";

export default async function AddGames() {

  const thisWeeksGames = await getThisWeeksGames();

  return (
    <AddGamesForm games={thisWeeksGames}/>
  );
}
