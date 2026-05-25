"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { Box, Typography } from "@mui/material";

export default function StandingsLineChart({ userStats = [], maxWeek = 0, maxSeries = 8, seriesData }) {
  // pick top users by totalPoints
  const topUsers = [...userStats].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, maxSeries);

  const series = seriesData
    ? seriesData
    : topUsers.map((u) => {
        const data = [];
        for (let i = 1; i <= maxWeek; i++) {
          data.push({ x: `W${i}`, y: Number(u[`week${i}`] || 0) });
        }
        return { label: u.name, data };
      });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Weekly Points by User (top {maxSeries})
      </Typography>
      <LineChart
        series={series}
        xAxis={[{ data: Array.from({ length: maxWeek }, (_, i) => `W${i + 1}`), scaleType: "band" }]}
        yAxis={[{ min: 0, label: "Points" }]}
        height={620}
        // tooltip
      />
    </Box>
  );
}
