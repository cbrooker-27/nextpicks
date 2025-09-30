"use client";
import { addGames } from "@/app/utils/db";
import AddGameTile from "../../components/games/addGameTile";
import { useState } from "react";
import { CircularProgress, Fab } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function AddGamesForm(props) {
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [games, setGames] = useState(props.games);
  const router = useRouter();

  function emptySpread(game) {
    return game.spread == null;
  }
  async function submitClicked(event) {
    event.preventDefault();
    console.log("adding games");
    setSubmitting(true);
    console.log(games);
    const result = await addGames(games);
    setSubmitting(false);
    setReadyToSubmit(false);
    router.push("/picks/view");
  }

  function gameSpreadUpdated(index, event) {
    const updatedGames = [...games];
    console.log("updating game", index, "with spread", event.target.value);
    updatedGames[index].spread = event.target.value ? parseInt(event.target.value) + 0.5 : null;
    const anyEmptySpreads = updatedGames.find(emptySpread);
    anyEmptySpreads ? setReadyToSubmit(false) : setReadyToSubmit(true);
    setGames(updatedGames);
  }

  function gameFavoriteUpdated(index, awayFavorite) {
    const updatedGames = [...games];
    console.log("updating game", index, "awayFavorite", awayFavorite);
    updatedGames[index].awayFavorite = awayFavorite;
    setGames(updatedGames);
  }

  return (
    <div>
      <div>
        <h1>Add Games</h1>
        {readyToSubmit && (
          <Fab
            style={{
              position: "fixed",
              bottom: 16,
              right: 16,
            }}
            color="primary"
            variant="extended"
            disabled={submitting}
            onClick={submitClicked}
          >
            {submitting ? (
              <>
                <CircularProgress size={24} style={{ marginLeft: 8 }} />
                Adding...
              </>
            ) : (
              <>
                <Add />
                Add Games
              </>
            )}
          </Fab>
        )}
      </div>
      {games.map((game, index) => (
        <AddGameTile
          game={game}
          key={index}
          index={index}
          spreadUpdated={gameSpreadUpdated}
          favoriteUpdated={gameFavoriteUpdated}
          teamDetails={props.teamDetails}
        />
      ))}
    </div>
  );
}
