"use client";

import { useMemo } from "react";
import { Card, CardActions, Button, CardContent, Typography, CardMedia, Chip, Box } from "@mui/material";
import { useSeasonStatistics } from "../context/SeasonStatistics";
import Slider from "@mui/material/Slider";
import { useRouter } from "next/navigation";

/**
 * WeeklyScoreCard
 * Props:
 * - userName: string (user id/name to look up picks)
 * - week: object (week info, e.g. { week: number, season: number })
 * - userStats: array (precomputed user stats for efficiency)
 * - pickedThisWeek: boolean (whether the user has picked this week)
 * - currentWeek: boolean (whether this is the current week)
 */
export default function WeeklyScoreCard({ userName, week, userStats, pickedThisWeek = false, currentWeek = false }) {
  const router = useRouter();
  const seasonStatistics = useSeasonStatistics();
  const { points, possiblePoints, leader, positionDisplay, positionNumber, medalEmoji, isLive } = useMemo(() => {
    const userStat = userStats.find((u) => u.name === userName);
    const pts = userStat ? userStat["week" + week.week] : 0;
    const count = userStat ? userStat["possiblePoints" + week.week] : 0;

    const leader = userStats.reduce((max, u) => Math.max(max, u["week" + week.week] || 0), 0);

    // compute position with tie handling for this week
    const allPoints = userStats.map((u) => u["week" + week.week] || 0).sort((a, b) => b - a);
    // const uniquePoints = Array.from(new Set(allPoints)).sort((a, b) => b - a);
    const posIndex = allPoints.indexOf(pts);
    const positionNumber = posIndex >= 0 ? posIndex + 1 : null;
    const tiedCount = userStats.filter((u) => (u["week" + week.week] || 0) === pts).length;
    const positionDisplay = positionNumber ? (tiedCount > 1 ? `T#${positionNumber}` : `#${positionNumber}`) : null;
    let medalEmoji = "";
    if (positionNumber === 1) medalEmoji = "🥇";
    else if (positionNumber === 2) medalEmoji = "🥈";
    else if (positionNumber === 3) medalEmoji = "🥉";
    else medalEmoji = "😢";

    // determine live vs final using seasonStatistics (games for the week)
    const seasonData = seasonStatistics?.seasonData || [];
    const gamesForWeek = seasonData.filter((g) => Number(g.week) === Number(week.week));
    const isLive = gamesForWeek.some(
      (g) => !(g.playedStatus && g.playedStatus.startsWith && g.playedStatus.startsWith("COMPLETED"))
    );

    return { points: pts, possiblePoints: count, leader, positionDisplay, positionNumber, medalEmoji, isLive };
  }, [userName, week, userStats, seasonStatistics]);

  const marks = [
    { value: 0, label: "0" },
    { value: leader, label: "leader (" + leader + ")" },
  ];
  if (possiblePoints !== leader) {
    marks.push({ value: possiblePoints, label: possiblePoints });
  }

  return userStats && userStats.length > 0 ? (
    <Card>
      <CardContent sx={{ backgroundColor: currentWeek ? (pickedThisWeek ? "green" : "yellow") : "default" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Typography variant="h6">
            {currentWeek ? (pickedThisWeek ? "Thanks for picking!" : "You need to pick!") : ""}
          </Typography>
          {
            /* Live/Final chip */
            !currentWeek ? (
              /* If not current week show finishing place and medal/sad emoji */

              <Chip
                label={`Finished ${positionDisplay}` + (positionNumber && positionNumber <= 3 ? medalEmoji : "😢")}
              />
            ) : (
              <Chip
                label={`Currently ${positionDisplay}` + (positionNumber && positionNumber <= 3 ? medalEmoji : "😢")}
              />
            )
          }
        </Box>
        {(!currentWeek || pickedThisWeek) && (
          <>
            <Typography variant="h2" sx={{ mb: 1 }}>
              {points}
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {currentWeek ? "This" : "Last"} Week&apos;s Score
            </Typography>
            <Typography variant="body2" color="text.secondary">
              out of {possiblePoints} possible points
            </Typography>
            <Slider
              aria-label="Always visible"
              defaultValue={points}
              disabled
              marks={marks}
              min={0}
              max={possiblePoints}
              valueLabelDisplay="on"
              sx={{ width: "90%", height: "20px", marginTop: "25px" }}
            />
          </>
        )}
      </CardContent>
      {currentWeek && !pickedThisWeek && (
        <CardActions>
          <Button size="large" onClick={() => router.push(`/picks/makePicks`)}>
            Make your picks
          </Button>
        </CardActions>
      )}
      {currentWeek && pickedThisWeek && (
        <CardActions>
          <Button size="large" onClick={() => router.push(`/picks/view`)}>
            View all picks
          </Button>
        </CardActions>
      )}
      {!currentWeek && (
        <CardActions>
          <Button size="large" onClick={() => router.push(`/picks/view?week=${week.week}&season=${week.season}`)}>
            View last week&apos;s picks
          </Button>
        </CardActions>
      )}
    </Card>
  ) : (
    <Card>
      <CardMedia component="img" height="240" image="/static/images/loading/fred_tabulating.gif" alt="loading stats" />
      <CardContent>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Calculating week {week.week} score...
        </Typography>
      </CardContent>
    </Card>
  );
}
