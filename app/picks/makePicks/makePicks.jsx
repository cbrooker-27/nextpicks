"use client";
import { getCurrentWeek, getThisWeeksPickedGames, getAllGames } from "@/app/utils/db";

import MakePicksForm from "./makePicksForm";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { getTeamStatisticsFromMsfWithStatus } from "@/app/lib/msf.js";
import { SeasonStatisticsProvider } from "@/app/context/SeasonStatistics";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Skeleton,
  Typography,
} from "@mui/material";
import { CancelOutlined, CheckCircleOutlined, ExpandMore, RemoveCircleOutlined } from "@mui/icons-material";

const INITIAL_CALL_STATUSES = [
  { key: "week", label: "Check the current week and season", status: "loading" },
  { key: "picks", label: "Load this week's games and saved picks", status: "loading" },
  { key: "teams", label: "Get team records from MySportsFeeds", status: "loading" },
  { key: "season", label: "Load season game history", status: "loading" },
];

export default function MakePicks() {
  const { data: session, status } = useSession();
  const [games, setGames] = useState(null);
  const [teamDetails, setTeamDetails] = useState([]);
  const [seasonData, setSeasonData] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [callStatuses, setCallStatuses] = useState(INITIAL_CALL_STATUSES);
  const hasStarted = status !== "loading" && Boolean(session?.user);
  const [statusExpanded, setStatusExpanded] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const requestStartedAt = useRef(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      signIn(null, { redirectTo: "/picks/makePicks" });
      return;
    }

    let isCurrent = true;
    requestStartedAt.current = Date.now();

    const setCallStatus = (key, nextStatus) => {
      if (!isCurrent) return;
      setCallStatuses((current) => current.map((call) => (call.key === key ? { ...call, status: nextStatus } : call)));
    };

    void getThisWeeksPickedGames()
      .then((picksString) => {
        if (!isCurrent) return;
        const thisWeeksPicks = JSON.parse(picksString || "[]");
        thisWeeksPicks.forEach((game) => {
          game.userChoice = game.userChoices?.find((choice) => choice.userId === session.user.name)?.choice;
        });
        setGames(thisWeeksPicks);
        setCallStatus("picks", "success");
      })
      .catch((error) => {
        console.error("Error loading pickable games:", error);
        if (!isCurrent) return;
        setLoadError("Unable to load picks right now.");
        setGames([]);
        setCallStatus("picks", "failed");
      });

    void getCurrentWeek()
      .then((week) => {
        if (!isCurrent) return;
        setCallStatus("week", "success");

        void getTeamStatisticsFromMsfWithStatus(week)
          .then((result) => {
            if (!isCurrent) return;
            setTeamDetails(result.data || []);
            setCallStatus("teams", result.source === "unavailable" ? "failed" : "success");
          })
          .catch((error) => {
            console.error("Error loading MSF team standings:", error);
            setCallStatus("teams", "failed");
          });

        void getAllGames(week.season)
          .then((gamesForSeason) => {
            if (!isCurrent) return;
            setSeasonData(gamesForSeason);
            setCallStatus("season", "success");
          })
          .catch((error) => {
            console.error("Error loading season games:", error);
            setCallStatus("season", "failed");
          });
      })
      .catch((error) => {
        console.error("Error loading current week:", error);
        if (!isCurrent) return;
        setCallStatus("week", "failed");
        setCallStatus("teams", "skipped");
        setCallStatus("season", "skipped");
      });

    return () => {
      isCurrent = false;
    };
  }, [session, status]);

  const requestedCalls = callStatuses.filter((call) => call.status !== "skipped");
  const succeededCalls = requestedCalls.filter((call) => call.status === "success").length;
  const hasPendingCalls = requestedCalls.some((call) => call.status === "loading");
  const hasFailedCalls = requestedCalls.some((call) => call.status === "failed");
  const allCallsResolved = requestedCalls.length > 0 && !hasPendingCalls;

  useEffect(() => {
    if (!hasStarted) return undefined;
    if (allCallsResolved) {
      setElapsedMs(Date.now() - requestStartedAt.current);
      setStatusExpanded(hasFailedCalls);
      return undefined;
    }

    setStatusExpanded(true);
    const timer = setInterval(() => setElapsedMs(Date.now() - requestStartedAt.current), 100);
    return () => clearInterval(timer);
  }, [allCallsResolved, hasFailedCalls, hasStarted]);

  if (!hasStarted) {
    return <p>Loading...</p>;
  }

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
      {loadError ? (
        <div role="alert">{loadError}</div>
      ) : games === null ? (
        <Skeleton />
      ) : games.length > 0 ? (
        <SeasonStatisticsProvider value={{ seasonData }}>
          <MakePicksForm games={games} teamDetails={teamDetails} />
        </SeasonStatisticsProvider>
      ) : (
        <div>No games found</div>
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
