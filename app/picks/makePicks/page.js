'use client';
import PickableGameTile from "@/components/games/pickableGameTile";
import { createContext, useContext, useState, useEffect } from "react";
export default function MakePicks(){
    const [games, setGames] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [readyToSubmit, setReadyToSubmit] = useState(false);

    function submitClicked(){
        console.log('submit clicked')
    }
    /* On load, go get games from our database */
    useEffect(() => {
        fetch("/api/picks/games/picks")
          .then((res) => res.json())
          .then((data) => {
            /* Update states to redraw */
            setGames(data.games);
            setLoading(false);
          });
      }, []);

      if (isLoading) return <p>Loading...</p>;
      if (!games) return <p>No game data</p>;
    
      console.log(games)
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