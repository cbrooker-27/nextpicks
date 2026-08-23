"use client";

import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

export default function TeamChart({ data }) {
  if (!data || data.length === 0) return <Alert severity="warning">No team data available.</Alert>;
  const series = [{ dataKey: "points", valueFormatter: (v) => `${v} pts` }];
  return (
    <Box sx={{ mb: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Points by Team</Typography>
      <BarChart
        height={300}
        dataset={data}
        series={series}
        xAxis={[{ scaleType: "band", dataKey: "team", label: "Team" }]}
        yAxis={[{ label: "Points" }]}
        animation={{ duration: 600 }}
      />
    </Box>
  );
}
