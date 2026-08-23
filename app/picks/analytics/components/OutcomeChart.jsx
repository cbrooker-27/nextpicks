// app/picks/analytics/components/OutcomeChart.jsx
"use client";

import { useState, useEffect } from "react";
import { Alert, Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { getOutcomeStats } from "../actions";

/**
 * Client‑side component that fetches outcome statistics via a server action.
 * It displays a bar chart of points per outcome (ff, uf, uu).
 */
export default function OutcomeChart() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data when the component mounts using async/await
    const fetchData = async () => {
      try {
        const result = await getOutcomeStats();
        setData(result);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchData();
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data || data.length === 0) return <Alert severity="warning">No outcome data available.</Alert>;

  const series = [{ dataKey: "points", valueFormatter: (v) => `${v} pts` }];

  return (
    <Box sx={{ height: 400, background: "rgba(255,255,255,0.08)", borderRadius: 2, p: 2 }}>
      <BarChart
        series={series}
        xAxis={[{ dataKey: "outcome", scaleType: "band" }]}
        yAxis={[{ label: "Points" }]}
        data={data}
        animation={{ duration: 600 }}
      />
    </Box>
  );
}
