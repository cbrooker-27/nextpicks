import GameTile from "./gameTile";
import { getThisWeeksGames } from "@/lib/msf";

export default async function AddGames(){

    const simpleGames = await getThisWeeksGames()
    
    return (<div><h1>Add Games</h1>
        {simpleGames.map(game=><GameTile game={game}/>)}
    </div>)
    
}