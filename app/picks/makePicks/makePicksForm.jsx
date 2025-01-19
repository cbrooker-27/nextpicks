'use client';
import PickableGameTile from "@/components/games/pickableGameTile";

import { useState } from "react";
export default function MakePicksForm(props){
    const [games, setGames] = useState(props.games);
    const [readyToSubmit, setReadyToSubmit] = useState(false);

    function submitClicked(){
        console.log('submit clicked')
    }
      if (!games) return <p>No game data</p>;
    
      return (
        <div>
          <div>
            <h1>Make Your Picks</h1>
            <button onClick={submitClicked} disabled={!readyToSubmit}>
              Submit
            </button>
          </div>
          {games.map((game, index) => (
            <PickableGameTile
              game={game}
              key={index}
              index={index}
            />
          ))}
        </div>
      );
}