"use client";

import { getTeamStatisticsFromMsfWithStatus, getGamesForWeekFromMsfWithStatus } from "@/app/lib/msf";
import { getCurrentWeek, getPickedGames, getThisYearsActiveUsers, getAllGames } from "@/app/utils/db";
import { useSearchParams } from "next/navigation";
import GameScoreTile from "@/app/components/games/gameScoreTile";
import {
  Skeleton,
  Chip,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Typography,
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@mui/material";
import { SmartToy, CheckCircleOutlined, CancelOutlined, RemoveCircleOutlined, ExpandMore } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { SeasonStatisticsContext } from "@/app/context/SeasonStatistics";

const INITIAL_CALL_STATUSES = [
  { key: "week", label: "Check the current week and season", status: "loading" },
  { key: "picks", label: "Load your picks and saved game scores", status: "loading" },
  { key: "users", label: "Load the player list", status: "loading" },
  { key: "season", label: "Load season game history", status: "loading" },
  { key: "scores", label: "Refresh live game scores", status: "loading" },
  { key: "teams", label: "Getting team records", status: "loading" },
];

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
  const [showScoreFailureDialog, setShowScoreFailureDialog] = useState(false);
  const [callStatuses, setCallStatuses] = useState(INITIAL_CALL_STATUSES);
  const [statusExpanded, setStatusExpanded] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const requestStartedAt = useRef(null);
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
      requestStartedAt.current = Date.now();
      const setCallStatus = (key, status) => {
        setCallStatuses((current) => current.map((call) => (call.key === key ? { ...call, status } : call)));
      };

      let currentWeek;
      try {
        currentWeek = await getCurrentWeek();
      } catch (error) {
        console.error("Error loading current week:", error);
        if (!isMounted) return;
        setCallStatus("week", "failed");
        setCallStatuses((current) =>
          current.map((call) => (call.key === "week" ? call : { ...call, status: "skipped" })),
        );
        setLoadError("Unable to load picks right now.");
        setIsLoading(false);
        return;
      }

      if (!isMounted) return;

      setCallStatuses(INITIAL_CALL_STATUSES);
      setCallStatus("week", "success");
      setElapsedMs(0);
      setIsLoading(true);
      setLoadError(null);
      const week = weekParam ? { week: Number(weekParam), season: currentWeek.season } : currentWeek;
      setWeek(week);

      void getThisYearsActiveUsers()
        .then((users) => {
          if (!isMounted) return;
          setActiveUsers(JSON.parse(users));
          setCallStatus("users", "success");
        })
        .catch((error) => {
          console.error("Error loading active users:", error);
          if (isMounted) setCallStatus("users", "failed");
        });

      void getAllGames(week.season)
        .then((games) => {
          if (!isMounted) return;
          setSeasonData(games);
          setCallStatus("season", "success");
        })
        .catch((error) => {
          console.error("Error loading season games:", error);
          if (isMounted) setCallStatus("season", "failed");
        });

      void getTeamStatisticsFromMsfWithStatus(week)
        .then((result) => {
          if (!isMounted) return;
          setTeamDetails(result.data || []);
          setCallStatus("teams", result.source === "unavailable" ? "failed" : "success");
        })
        .catch((error) => {
          console.error("Error loading MSF team standings:", error);
          if (isMounted) setCallStatus("teams", "failed");
        });

      if (week.week === currentWeek.week) {
        void getGamesForWeekFromMsfWithStatus(week)
          .then((result) => {
            if (!isMounted) return;
            setGamesWithScores(result.data || []);
            setShowScoreFailureDialog(result.source === "unavailable");
            setCallStatus("scores", result.source === "unavailable" ? "failed" : "success");
          })
          .catch((error) => {
            console.error("Error loading MSF game scores:", error);
            if (!isMounted) return;
            setShowScoreFailureDialog(true);
            setCallStatus("scores", "failed");
          });
      } else {
        setGamesWithScores([]);
        setShowScoreFailureDialog(false);
        setCallStatus("scores", "skipped");
      }

      try {
        const fetchedPicks = await getPickedGames(week);
        if (!isMounted) return;
        setPickedGames(JSON.parse(fetchedPicks));
        setLoadError(null);
        setCallStatus("picks", "success");
      } catch (error) {
        console.error("Error loading picks:", error);
        if (isMounted) {
          setLoadError("Unable to load picks right now.");
          setCallStatus("picks", "failed");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [weekParam]);

  const requestedCalls = callStatuses.filter((call) => call.status !== "skipped");
  const succeededCalls = requestedCalls.filter((call) => call.status === "success").length;
  const hasPendingCalls = requestedCalls.some((call) => call.status === "loading");
  const hasFailedCalls = requestedCalls.some((call) => call.status === "failed");
  const allCallsResolved = requestedCalls.length > 0 && !hasPendingCalls;

  useEffect(() => {
    if (allCallsResolved) {
      setElapsedMs(Date.now() - requestStartedAt.current);
      setStatusExpanded(hasFailedCalls);
      return;
    }

    setStatusExpanded(true);
    const timer = setInterval(() => setElapsedMs(Date.now() - requestStartedAt.current), 100);
    return () => clearInterval(timer);
  }, [allCallsResolved, hasFailedCalls]);

  updateUserPoints(pickedGames, gamesWithScores, activeUsers);

  return (
    <>
      <Accordion
        component="section"
        aria-label="Data retrieval status"
        expanded={!allCallsResolved || statusExpanded}
        onChange={(_event, expanded) => {
          if (allCallsResolved) setStatusExpanded(expanded);
        }}
        disableGutters
        sx={{ mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">
            {succeededCalls} of {requestedCalls.length} calls succeeded
            {allCallsResolved ? " · resolved in " : " · "}
            {(elapsedMs / 1000).toFixed(1)}s{allCallsResolved ? "" : " elapsed"}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box aria-live="polite" sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {callStatuses.map((call) => (
              <Box key={call.key} sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 24 }}>
                <CallStatusIcon status={call.status} />
                <Typography variant="body2">{call.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                  {call.status === "loading"
                    ? "Loading"
                    : call.status === "success"
                      ? "Done"
                      : call.status === "failed"
                        ? "Failed"
                        : "Not needed"}
                </Typography>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
      {isLoading ? (
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
          Live game scores are unavailable. Showing the latest scores we have.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScoreFailureDialog(false)} autoFocus>
            Continue
          </Button>
        </DialogActions>
      </Dialog>
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
          const liveDetails = historicalWeek
            ? game
            : {
                ...game,
                ...(gamesWithScores.find((g) => String(g._id) === String(game._id)) || {}),
              };
          return (
            <GameScoreTile
              game={game}
              liveDetails={liveDetails}
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
      )}
    </>
  );
}

function CallStatusIcon({ status }) {
  if (status === "loading") return <CircularProgress size={16} aria-label="Loading" />;
  if (status === "success") return <CheckCircleOutlined color="success" aria-label="Done" />;
  if (status === "failed") return <CancelOutlined color="error" aria-label="Failed" />;
  return <RemoveCircleOutlined color="disabled" aria-label="Not needed" />;
}

function updateUserPoints(pickedGames, gamesWithScores, activeUsers) {
  activeUsers.forEach((user) => {
    user.points = 0;
    user.volatilePoints = 0;
  });
  pickedGames.map((game) => {
    const gameData = {
      ...game,
      ...(gamesWithScores.find((g) => String(g._id) === String(game._id)) || {}),
    };
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
