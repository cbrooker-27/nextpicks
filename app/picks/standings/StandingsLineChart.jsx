"use client";

import React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Box, Typography } from "@mui/material";

export default function StandingsLineChart({ userStats = [], maxWeek = 0, maxSeries = 8, includeAdminPicks = true }) {
  // pick top users by totalPoints
  const topUsers = [...userStats].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, maxSeries);

  const series = topUsers.map((u) => {
    const data = [];
    for (let i = 1; i <= maxWeek; i++) {
      data.push({ x: `W${i}`, y: Number(u[`week${i}`] || 0) });
    }
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

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Weekly Points by User (top {maxSeries})
      </Typography>
      <LineChart
        series={series}
        xAxis={[{ data: Array.from({ length: 17 }, (_, i) => String("W" + (i + 1))) }]}
        yAxis={[{ min: 0, label: "Points" }]}
        height={420}
        // tooltip
      />
    </Box>
  );
}
