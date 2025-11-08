"use client";

import { getTeamStatisticsFromMsf, getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getCurrentWeek, getPickedGames, getThisYearsActiveUsers, getAllGames } from "@/app/utils/db";
import { useSearchParams } from "next/navigation";
import GameScoreTile from "@/app/components/games/gameScoreTile";
import { Skeleton, Chip, Avatar, Tooltip, Switch } from "@mui/material";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { SeasonStatisticsContext } from "@/app/context/SeasonStatistics";

export default function ViewPicks() {
  const [pickedGames, setPickedGames] = useState([]);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showInProgress, setShowInProgress] = useState(true);
  const [teamDetails, setTeamDetails] = useState([]);
  const [seasonData, setSeasonData] = useState([]);
  const [week, setWeek] = useState(null);
  const { data: session, status } = useSession();
  const weekParam = useSearchParams().get("week");
  const historicalWeek = weekParam && weekParam !== week?.week;

  // if user is not authenticated, send them to sign in
  if (status !== "loading" && !session?.user) {
    signIn();
  }

  useEffect(() => {
    async function fetchData() {
      // always fetch current week to obtain season if a week param is provided
      const currentWeek = await getCurrentWeek();
      const week = weekParam ? { week: Number(weekParam), season: currentWeek.season } : currentWeek;
      const fetchedPicks = await getPickedGames(week);
      if (week.week === currentWeek.week) {
        const gamesWithScores = await getGamesForWeekFromMsf(week);
        setGamesWithScores(gamesWithScores);
      }

      const activeUsers = await getThisYearsActiveUsers();
      const teamDetails = await getTeamStatisticsFromMsf(week);
      const seasonData = await getAllGames(week.season);

      setSeasonData(seasonData);
      setTeamDetails(teamDetails);
      setActiveUsers(JSON.parse(activeUsers));
      setPickedGames(JSON.parse(fetchedPicks));
      setWeek(week);
      setIsLoading(false);
    }
    void fetchData();
  }, [weekParam]);

  updateUserPoints(pickedGames, gamesWithScores, activeUsers);

  return isLoading ? (
    <Skeleton />
  ) : (
    <div>
      <h2>
        Viewing picks for week {week.week}, {week.season}
      </h2>
      {!historicalWeek && (
        <>
          <Switch checked={showInProgress} onChange={() => setShowInProgress(!showInProgress)} />
          Show points from in-progress games
        </>
      )}
      {!historicalWeek && showInProgress ? (
        <div>
          <h2>Including In-Progress</h2>
          {activeUsers
            .sort((a, b) => b.points + b.volatilePoints - a.points - a.volatilePoints)
            .map((user) => (
              <Tooltip key={user.name} title={user.name} arrow>
                <Chip
                  key={user.name}
                  avatar={
                    <Avatar alt={user.name} src={user?.image}>
                      {user?.name.substring(0, 1)}
                    </Avatar>
                  }
                  label={user.points + user.volatilePoints}
                  variant={user.name === session?.user?.name ? "filled" : "outlined"}
                  color={user.name === session?.user?.name ? "primary" : "default"}
                />
              </Tooltip>
            ))}
        </div>
      ) : (
        <div>
          {activeUsers.map((user) => (
            <Tooltip key={user.name} title={user.name} arrow>
              <Chip
                key={user.name}
                avatar={
                  <Avatar alt={user.name} src={user?.image}>
                    {user?.name.substring(0, 1)}
                  </Avatar>
                }
                label={user.points}
                variant={user.name === session?.user?.name ? "filled" : "outlined"}
                color={user.name === session?.user?.name ? "primary" : "default"}
              />
            </Tooltip>
          ))}
        </div>
      )}
      <br />
      <SeasonStatisticsContext.Provider value={{ seasonData: seasonData }}>
        {pickedGames.map((game) => {
          const gameData = historicalWeek ? game : gamesWithScores.find((g) => g._id === game._id);
          return (
            <GameScoreTile
              game={game}
              liveDetails={gameData}
              key={game._id}
              users={activeUsers}
              activeUser={session?.user}
              teamDetails={teamDetails}
            />
          );
        })}
      </SeasonStatisticsContext.Provider>
    </div>
  );
}

function updateUserPoints(pickedGames, gamesWithScores, activeUsers) {
  activeUsers.forEach((user) => {
    user.points = 0;
    user.volatilePoints = 0;
  });
  pickedGames.map((game) => {
    const gameData = gamesWithScores?.length > 0 ? gamesWithScores.find((g) => g._id === game._id) : game;
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
