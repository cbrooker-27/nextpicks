"use client";

import { useMemo } from "react";
import { Card, CardActions, Button, CardContent, Typography, CardMedia } from "@mui/material";
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
export default function WeeklyScoreCard({ userName, week, userStats, pickedThisWeek, currentWeek }) {
  const router = useRouter();
  const seasonStatistics = useSeasonStatistics();
  const { points, possiblePoints, leader } = useMemo(() => {
    const userStat = userStats.find((u) => u.name === userName);
    const pts = userStat ? userStat["week" + week.week] : 0;
    const count = userStat ? userStat["possiblePoints" + week.week] : 0;

    const leader = userStats.reduce((max, u) => Math.max(max, u["week" + week.week] || 0), 0);

    return { points: pts, possiblePoints: count, leader };
  }, [userName, week, seasonStatistics, userStats]);

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
        <Typography variant="h6">
          {currentWeek ? (pickedThisWeek ? "Thanks for picking!" : "You need to pick!") : ""}
        </Typography>
        {(!currentWeek || pickedThisWeek) && (
          <>
            <Typography variant="h2" sx={{ mb: 1 }}>
              {points}
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {currentWeek ? "This" : "Last"} Week's Score
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
