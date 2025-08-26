"use client";
import PickableGameTile from "@/components/games/pickableGameTile";
import { addUserChoices } from "@/utils/db";
import { SportsFootball } from "@mui/icons-material";
import { Fab } from "@mui/material";
import { signIn, useSession } from "next-auth/react";

import { useState } from "react";

// TODO Need to make sure user has not already picked

export default function MakePicksForm(props) {
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }
  if (status === "unauthenticated") {
    signIn();
  }

  const games = props.games;

  function choiceChanged(index, choice) {
    console.log(`Game: ${games[index]._id}, Choice: ${choice}`);
    games[index].userChoice = choice;
    const anyEmptyChoices = games.some((game, i) => !game.userChoice);
    setReadyToSubmit(!anyEmptyChoices);
  }

  async function submitClicked(event) {
    event.preventDefault();
    const choices = [];
    games.forEach((game) => {
      choices.push({
        gameId: game._id,
        userId: session.user.name,
        choice: game.userChoice,
      });
    });
    const result = await addUserChoices(choices);
    console.log(JSON.parse(result));
  }
  if (!games) return <p>No game data</p>;

  return (
    <div>
      <div>
        <h1>Make Your Picks</h1>
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
            <SportsFootball />
            Submit Picks
          </Fab>
        )}
      </div>
      {games.map((game, index) => (
        <PickableGameTile game={game} key={index} index={index} choiceChanged={choiceChanged} />
      ))}
    </div>
  );
}
