"use client";
import { addGames } from "@/utils/db";
import GameTile from "../../../components/games/gameTile";
import { useState } from "react";
import { Fab } from "@mui/material";
import { Add } from "@mui/icons-material";

export default function AddGamesForm(props) {
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [games, setGames] = useState(props.games);

  function emptySpread(game) {
    return game.spread == null;
  }
  async function submitClicked(event) {
    event.preventDefault();
    console.log("adding games");
    console.log(games);
    await addGames(games);
  }

  function gameSpreadUpdated(index, event) {
    const updatedGames = [...games];
    console.log("updating game", index, "with spread", event.target.value);
    updatedGames[index].spread = event.target.value
      ? parseInt(event.target.value) + 0.5
      : null;
    const anyEmptySpreads = updatedGames.find(emptySpread);
    anyEmptySpreads ? setReadyToSubmit(false) : setReadyToSubmit(true);
    setGames(updatedGames);
  }

  return (
    <div>
      <div>
        <h1>Add Games</h1>
        {/* <button onClick={submitClicked} disabled={!readyToSubmit}>
          Submit
        </button> */}
        {readyToSubmit && (
          <Fab
            style={{
              position: "fixed",
              bottom: 16,
              right: 16,
            }}
            color="primary"
            variant="extended"
            onClick={submitClicked}
          >
            <Add />
            Add Games
          </Fab>
        )}
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
