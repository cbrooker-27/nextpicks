"use client";

import React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Box, Typography } from "@mui/material";

export default function StandingsLineChart({ userStats = [], maxWeek = 0, maxSeries = 8, includeAdminPicks = true }) {
  // pick top users by totalPoints
  const topUsers = [...userStats].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, maxSeries);

  const series = topUsers.map((u) => {
    const data = Array.from({ length: maxWeek }, (_, index) => Number(u[`week${index + 1}`] || 0));
    return {
      label: u.name,
      data,
      valueFormatter: (value, { dataIndex }) => {
        const adminPoints = u[`adminPointsWeek${dataIndex + 1}`] || 0;
        const adminNote = includeAdminPicks ? "points from admin picks" : "points from admin picks excluded";
        return adminPoints > 0 ? `${value}* (${adminPoints} ${adminNote})` : String(value ?? 0);
      },
    };
  });
  const nonZeroPoints = series.flatMap(({ data }) => data.filter((value) => Number.isFinite(value) && value > 0));
  const yAxisMin = nonZeroPoints.length ? Math.min(...nonZeroPoints) - 1 : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Weekly Points by User (top {maxSeries})
      </Typography>
      <LineChart
        series={series}
        xAxis={[{ scaleType: "point", data: Array.from({ length: maxWeek }, (_, i) => `W${i + 1}`) }]}
        yAxis={[{ min: yAxisMin, label: "Points" }]}
        height={420}
        // tooltip
      />
    </Box>
  );
}
