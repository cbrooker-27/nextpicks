"use client";
import { addGames } from "@/app/utils/db";
import AddGameTile from "../../components/games/addGameTile";
import { useState } from "react";
import { CircularProgress, Fab } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import styles from "./addGamesForm.module.css";

function getStoredSpread(value) {
  const parsedSpread = Number(value);
  if (!Number.isFinite(parsedSpread)) {
    return null;
  }
  const roundedSpread = Math.floor(parsedSpread);
  return (roundedSpread < 2 ? 0 : roundedSpread) + 0.5;
}

export default function AddGamesForm(props) {
  const [games, setGames] = useState(() =>
    props.games.map((game) => {
      const odds = props.gameSpreads[String(game._id)];
      return odds
        ? { ...game, spread: getStoredSpread(odds.spread), awayFavorite: odds.awayFavorite }
        : { ...game, spread: game.spread ?? null, awayFavorite: game.awayFavorite ?? false };
    }),
  );
  const [readyToSubmit, setReadyToSubmit] = useState(
    () => games.length > 0 && games.every((game) => game.spread != null),
  );
  const [submitting, setSubmitting] = useState(false);
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
    const spread = event.target.value === "" ? null : getStoredSpread(event.target.value);
    const updatedGames = games.map((game, gameIndex) =>
      gameIndex === index ? { ...game, spread } : game,
    );
    const anyEmptySpreads = updatedGames.some(emptySpread);
    setReadyToSubmit(updatedGames.length > 0 && !anyEmptySpreads);
    setGames(updatedGames);
  }

  function gameFavoriteUpdated(index, awayFavorite) {
    setGames(games.map((game, gameIndex) =>
      gameIndex === index ? { ...game, awayFavorite } : game,
    ));
  }

  return (
    <div className={styles.form}>
      <div className={styles.header}>
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
          odds={props.gameSpreads[String(game._id)]}
        />
      ))}
    </div>
  );
}
