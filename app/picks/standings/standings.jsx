import { getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getCurrentWeek, getPickedGames, getThisYearsActiveUsers } from "@/app/utils/db";
import { auth, signIn } from "@/auth";
import { Chip, Avatar, Tooltip } from "@mui/material";
// import { useEffect, useState } from "react";
// import { signIn, useSession } from "next-auth/react";

export default async function Standings() {
  const session = await auth();

  const week = await getCurrentWeek();
  const activeUsers = JSON.parse(await getThisYearsActiveUsers());

  activeUsers.forEach((user) => {
    user.totalPoints = 0;
    user.points = [];
    user.points[0] = 0;
  });

  for (let i = 1; i < week.week; i++) {
    const pickedGames = JSON.parse(await getPickedGames({ week: i, season: week.season }));
    const gamesWithScores = await getGamesForWeekFromMsf({ week: "" + i, season: "" + week.season });

    activeUsers.forEach((user) => {
      user.points[i] = 0;
    });

    pickedGames.map((game) => {
      const gameData = gamesWithScores.find((g) => g._id === game._id);
      let gamePoints = [];
      const favScore = game.awayFavorite ? gameData.awayScore : gameData.homeScore;
      const undScore = game.awayFavorite ? gameData.homeScore : gameData.awayScore;
      if (favScore - game.spread > undScore) {
        gamePoints["ff"] = 2;
        gamePoints["uf"] = 1;
        gamePoints["uu"] = 0;
      } else if (favScore - game.spread < undScore && favScore > undScore) {
        gamePoints["ff"] = 1;
        gamePoints["uf"] = 2;
        gamePoints["uu"] = 1;
      } else if (favScore - game.spread < undScore && favScore === undScore) {
        gamePoints["ff"] = 0;
        gamePoints["uf"] = 1;
        gamePoints["uu"] = 1;
      } else {
        gamePoints["ff"] = 0;
        gamePoints["uf"] = 1;
        gamePoints["uu"] = 2;
      }
      activeUsers.forEach((user) => {
        const userChoice = game.userChoices.find((choice) => choice.userId === user.name);

        if (gameData.playedStatus.startsWith("COMPLETED")) {
          user.points[i] += gamePoints[userChoice?.choice] || 0;
          user.totalPoints += gamePoints[userChoice?.choice] || 0;
        } else if (gameData.playedStatus === "LIVE") {
          console.log("Game in progress, no points awarded yet...should not get here");
        }
      });
    });
  }
  activeUsers.sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "150px" }}>
      <h2>Standings</h2>
      {activeUsers.map((user) => (
        <Tooltip key={user.name} title={"[" + user.points.slice(1).join(", ") + "]"} arrow>
          <Chip
            key={user.name}
            avatar={
              <Avatar alt={user.name} src={user?.image}>
                {user?.name.substring(0, 1)}
              </Avatar>
            }
            label={user.name + " - " + user.totalPoints}
            variant={user.name === session?.user?.name ? "filled" : "outlined"}
            color={user.name === session?.user?.name ? "primary" : "default"}
          />
        </Tooltip>
      ))}
    </div>
  );
}
