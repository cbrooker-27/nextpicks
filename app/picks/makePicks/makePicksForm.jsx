"use client";
import PickableGameTile from "@/app/components/games/pickableGameTile";
import { addUserChoices } from "@/app/utils/db";
import { SportsFootball } from "@mui/icons-material";
import { CircularProgress, Fab } from "@mui/material";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useState } from "react";

// TODO Need to make sure user has not already picked
// right now i only remove the submit button, but we should throw up
// a message saying picks are in progress (some kind of loading thingy)
// then send them to view picks

export default function MakePicksForm(props) {
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

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
    const selectionTime = new Date().toISOString();
    setSubmitting(true);
    const choices = [];
    games.forEach((game) => {
      choices.push({
        gameId: game._id,
        userId: session.user.name,
        choice: game.userChoice,
        selectionTime: selectionTime,
      });
    });
    const result = await addUserChoices(choices);
    setSubmitting(false);
    setReadyToSubmit(false);
    router.push("/picks/view");
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
            disabled={submitting}
            onClick={submitClicked}
          >
            {submitting ? (
              <>
                <CircularProgress size={24} style={{ marginLeft: 8 }} />
                Submitting...
              </>
            ) : (
              <>
                <SportsFootball />
                Submit Picks
              </>
            )}
          </Fab>
        )}
      </div>
      {games.map((game, index) => (
        <PickableGameTile game={game} key={game._id} index={index} choiceChanged={choiceChanged} />
      ))}
    </div>
  );
}
