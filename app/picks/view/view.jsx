"use client";

import { getTeamStatisticsFromMsfWithStatus, getGamesForWeekFromMsfWithStatus } from "@/app/lib/msf";
import { getCurrentWeek, getPickedGames, getThisYearsActiveUsers, getAllGames } from "@/app/utils/db";
import { useSearchParams } from "next/navigation";
import GameScoreTile from "@/app/components/games/gameScoreTile";
import { Skeleton, Chip, Avatar, Tooltip, Switch, FormControlLabel, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { SmartToy } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { SeasonStatisticsContext } from "@/app/context/SeasonStatistics";

export default function ViewPicks() {
  const [pickedGames, setPickedGames] = useState([]);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showInProgress, setShowInProgress] = useState(true);
  const [includeNpc, setIncludeNpc] = useState(true);
  const [teamDetails, setTeamDetails] = useState([]);
  const [seasonData, setSeasonData] = useState([]);
  const [week, setWeek] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [msfWarnings, setMsfWarnings] = useState([]);
  const [showScoreFailureDialog, setShowScoreFailureDialog] = useState(false);
  const { data: session, status } = useSession();
  const weekParam = useSearchParams().get("week");
  const historicalWeek = weekParam && weekParam !== week?.week;

  // if user is not authenticated, send them to sign in
  if (status !== "loading" && !session?.user) {
    signIn();
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const currentWeek = await getCurrentWeek();
        if (!isMounted) return;
        setIsLoading(true);
        setLoadError(null);
        const week = weekParam ? { week: Number(weekParam), season: currentWeek.season } : currentWeek;
        const results = await Promise.allSettled([
          getPickedGames(week),
          week.week === currentWeek.week ? getGamesForWeekFromMsfWithStatus(week) : Promise.resolve({ data: [], source: "not-requested" }),
          getThisYearsActiveUsers(),
          getTeamStatisticsFromMsfWithStatus(week),
          getAllGames(week.season),
        ]);

        if (!isMounted) return;

        const [fetchedPicks, gamesWithScores, activeUsers, teamDetails, seasonData] = results;
        const storedGames = fetchedPicks.status === "fulfilled" ? JSON.parse(fetchedPicks.value) : [];
        const gamesResult = gamesWithScores.status === "fulfilled" ? gamesWithScores.value : { data: [], source: "unavailable" };
        const teamsResult = teamDetails.status === "fulfilled" ? teamDetails.value : { data: [], source: "unavailable" };
        const liveGamesById = new Map((gamesResult.data || []).map((game) => [String(game._id), game]));
        const displayGames = storedGames.map((game) => ({
          ...game,
          ...(liveGamesById.get(String(game._id)) || {}),
        }));
        setPickedGames(storedGames);
        setGamesWithScores(displayGames);
        setActiveUsers(activeUsers.status === "fulfilled" ? JSON.parse(activeUsers.value) : []);
        setTeamDetails(teamsResult.data);
        setSeasonData(seasonData.status === "fulfilled" ? seasonData.value : []);
        setWeek(week);
        setMsfWarnings([
          teamsResult.source === "unavailable" ? "Live team standings are unavailable." : null,
        ].filter(Boolean));
        setShowScoreFailureDialog(gamesResult.source === "unavailable");
        setLoadError(null);
      } catch (error) {
        console.error("Error loading view picks:", error);
        if (isMounted) setLoadError("Unable to load picks right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [weekParam]);

  updateUserPoints(pickedGames, gamesWithScores, activeUsers);

  return isLoading ? (
    <Skeleton />
  ) : loadError ? (
    <div role="alert">{loadError}</div>
  ) : (
    <div>
      <Dialog
        open={showScoreFailureDialog}
        onClose={() => setShowScoreFailureDialog(false)}
        aria-labelledby="score-retrieval-failure-title"
        aria-describedby="score-retrieval-failure-description"
      >
        <DialogTitle id="score-retrieval-failure-title">Live score retrieval failed</DialogTitle>
        <DialogContent id="score-retrieval-failure-description">
          Previously saved scores from the games table are being shown where available. They may be out of date.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScoreFailureDialog(false)} autoFocus>
            Continue
          </Button>
        </DialogActions>
      </Dialog>
      {msfWarnings.map((warning) => (
        <div key={warning} role="status">{warning}</div>
      ))}
      <h2>
        Viewing picks for week {week.week}, {week.season}
      </h2>
      {!historicalWeek && (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControlLabel
            control={<Switch checked={showInProgress} onChange={() => setShowInProgress(!showInProgress)} />}
            label="Show points from in-progress games"
          />
          <FormControlLabel
            control={<Switch checked={includeNpc} onChange={(e) => setIncludeNpc(e.target.checked)} />}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                Include NPCs
                <SmartToy sx={{ fontSize: 18 }} />
              </Box>
            }
          />
        </Box>
      )}
      {!historicalWeek && showInProgress ? (
        <div>
          <h2>Including In-Progress</h2>
          {activeUsers
            .filter((u) => (includeNpc ? true : !u.npc))
            .sort((a, b) => b.points + b.volatilePoints - a.points - a.volatilePoints)
            .map((user) => (
              <Tooltip key={user.name} title={user.name} arrow>
                <Chip
                  key={user.name}
                  avatar={
                    <Avatar
                      alt={user.name}
                      src={user?.image}
                      sx={{ border: user?.npc ? "2px solid orange" : "2px solid transparent", boxSizing: "border-box" }}
                    >
                      {user?.name.substring(0, 1)}
                    </Avatar>
                  }
                  label={user.points + user.volatilePoints}
                  variant={user.name === session?.user?.name ? "filled" : "outlined"}
                  color={user.name === session?.user?.name ? "primary" : "default"}
                  sx={user?.npc ? { border: "1px solid orange" } : undefined}
                />
              </Tooltip>
            ))}
        </div>
      ) : (
        <div>
          {activeUsers
            .filter((u) => (includeNpc ? true : !u.npc))
            .map((user) => (
              <Tooltip key={user.name} title={user.name} arrow>
                <Chip
                  key={user.name}
                  avatar={
                    <Avatar
                      alt={user.name}
                      src={user?.image}
                      sx={{ border: user?.npc ? "2px solid orange" : "2px solid transparent", boxSizing: "border-box" }}
                    >
                      {user?.name.substring(0, 1)}
                    </Avatar>
                  }
                  label={user.points}
                  variant={user.name === session?.user?.name ? "filled" : "outlined"}
                  color={user.name === session?.user?.name ? "primary" : "default"}
                  sx={user?.npc ? { border: "1px solid orange" } : undefined}
                />
              </Tooltip>
            ))}
        </div>
      )}
      <br />
      <SeasonStatisticsContext.Provider value={{ seasonData: seasonData }}>
        {pickedGames.map((game) => {
          const gameData = historicalWeek ? game : gamesWithScores.find((g) => String(g._id) === String(game._id));
          return (
            <GameScoreTile
              game={game}
              liveDetails={gameData}
              key={game._id}
              users={activeUsers}
              activeUser={session?.user}
              teamDetails={teamDetails}
              includeNpc={includeNpc}
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
    if (
      !gameData ||
      !Number.isFinite(gameData.homeScore) ||
      !Number.isFinite(gameData.awayScore) ||
      typeof gameData.playedStatus !== "string"
    ) {
      return;
    }
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
