"use client";
import GameTile from "./gameTile";
import { createContext, useContext, useState, useEffect } from "react";

export default function AddGames() {
  const [games, setGames] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [readyToSubmit, setReadyToSubmit] = useState(false);

  useEffect(() => {
    fetch("/api/picks/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      });
  }, []);

  function emptySpread(game) {
    return game.spread == null;
  }

  async function submitClicked(event) {
    console.log(games);
    event.preventDefault();
    console.log("adding games")
    const result = await fetch('/api/picks/games/add', {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(games), // body data type must match "Content-Type" header
    });
    const responseData = await result.json()
    console.log(responseData)
  }

  function gameSpreadUpdated(index, event) {
    const updatedGames = [...games];
    updatedGames[index].spread = parseInt(event.target.value)+0.5;
    const anyEmptySpreads = updatedGames.find(emptySpread)
    if(!anyEmptySpreads)
    {
      setReadyToSubmit(true)
    }
    setGames(updatedGames);
  }

  if (isLoading) return <p>Loading...</p>;
  if (!games) return <p>No game data</p>;

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
