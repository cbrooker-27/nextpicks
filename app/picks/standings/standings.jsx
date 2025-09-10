"use client";
import { getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getPickedGames, getThisYearsActiveUsers } from "@/app/utils/db";
import { Skeleton, Chip, Avatar, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function EnterScores() {
  const [pickedGames, setPickedGames] = useState([]);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const { data: session, status } = useSession();

  // if user is not authenticated, send them to sign in
  if (status !== "loading" && !session?.user) {
    signIn();
  }

  useEffect(() => {
    async function fetchData() {
      const fetchedPicks = await getPickedGames({ week: 1, season: 2025 });
      const gamesWithScores = await getGamesForWeekFromMsf({ week: "1", season: "2025" });
      const activeUsers = await getThisYearsActiveUsers();
      setActiveUsers(JSON.parse(activeUsers));
      setPickedGames(JSON.parse(fetchedPicks));
      setGamesWithScores(gamesWithScores);
      setIsLoading(false);
    }
    void fetchData();
  }, []);

  updateUserPoints(pickedGames, gamesWithScores, activeUsers);

  return isLoading ? (
    <Skeleton />
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "150px" }}>
      <h2>Standings</h2>
      {activeUsers.map((user) => (
        <Tooltip key={user.name} title={user.name} arrow>
          <Chip
            key={user.name}
            avatar={
              <Avatar alt={user.name} src={user?.image}>
                {user?.name.substring(0, 1)}
              </Avatar>
            }
            label={user.name + " - " + user.points}
            variant={user.name === session?.user?.name ? "filled" : "outlined"}
            color={user.name === session?.user?.name ? "primary" : "default"}
          />
        </Tooltip>
      ))}
    </div>
  );
}

function updateUserPoints(pickedGames, gamesWithScores, activeUsers) {
  activeUsers.forEach((user) => {
    user.points = 0;
    user.volatilePoints = 0;
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
        user.points += gamePoints[userChoice?.choice] || 0;
      } else if (gameData.playedStatus === "LIVE") {
        user.volatilePoints += gamePoints[userChoice?.choice] || 0;
      }
    });
  });
  activeUsers.sort((a, b) => b.points - a.points);
}
