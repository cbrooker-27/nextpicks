// app/picks/analytics/components/SpreadChart.jsx
"use client";

import { Box, Alert } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

/**
 * Props:
 * - data: array of spread statistics (bucket or raw)
 * - mode: 'summarized' | 'individual' (determines x‑axis key)
 */
export default function SpreadChart({ data, mode }) {
  if (!data || data.length === 0) {
    return <Alert severity="warning">No spread data available.</Alert>;
  }

  const xKey = mode === "summarized" ? "bucket" : "spread";
  const series = [
    {
      dataKey: "points",
      valueFormatter: (v) => `${v} pts`,
    },
  ];

  // Ensure numeric values are numbers for raw mode
  const chartData = data.map((d) => ({
    ...d,
    spread: typeof d.spread === "string" ? Number(d.spread) : d.spread,
  }));

  return (
    <Box sx={{ mb: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2, p: 2 }}>
      <LineChart
        height={300}
        dataset={chartData}
        series={series}
        xAxis={[{ scaleType: "band", dataKey: xKey, label: mode === "summarized" ? "Bucket" : "Spread" }]}
        yAxis={[{ label: "Points" }]}
        animation={{ duration: 600 }}
      />
    </Box>
  );
}
