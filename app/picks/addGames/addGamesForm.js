'use client'
import { addGames } from "@/lib/db";
import GameTile from "../../../components/games/gameTile";
import { useState } from "react";

export default function AddGamesForm(props) {
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [games, setGames] = useState(props.games)

  function emptySpread(game) {
    return game.spread == null;
  }
  async function submitClicked(event) {
    event.preventDefault();
    console.log("adding games")
    console.log(games);
    await addGames(games);
  }

  function gameSpreadUpdated(index, event) {
    const updatedGames = [...games];
    updatedGames[index].spread = parseInt(event.target.value)+0.5;
    const anyEmptySpreads = updatedGames.find(emptySpread)
    if(!anyEmptySpreads)
    {
      console.log('all spreads set')
      setReadyToSubmit(true)
    }
    setGames(updatedGames);
  }

  return (
    <div>
      <div>
        <h1>Add Games</h1>
        <button onClick={submitClicked} disabled={!readyToSubmit}>
          Submit
        </button>
      </div>
      {games.map((game, index) => (
        <GameTile
          game={game}
          key={index}
          index={index}
          spreadUpdated={gameSpreadUpdated}
        />
      ))}
    </div>
  );
}
