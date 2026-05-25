"use client";

import { BarChart } from "@mui/x-charts";
import { Box, Typography } from "@mui/material";

export default function SpreadChart({ stats = [] }) {
  // ensure stats sorted by numeric spread
  const sorted = [...stats].sort((a, b) => a.spread - b.spread);

  //   const overall = sorted.map((r) => ({ x: String(r.spread), y: r.total > 0 ? (r.favBetter / r.total) * 100 : 0 }));
  //   const favHome = sorted.map((r) => ({
  //     x: String(r.spread),
  //     y: r.favHome?.total > 0 ? (r.favHome.favBetter / r.favHome.total) * 100 : 0,
  //   }));
  //   const favAway = sorted.map((r) => ({
  //     x: String(r.spread),
  //     y: r.favAway?.total > 0 ? (r.favAway.favBetter / r.favAway.total) * 100 : 0,
  //   }));

  const dataset = sorted.map((r) => ({
    overall: r.total > 0 ? (r.ff / r.total) * 100 : 0,
    favHomeFF: r.favHome?.total > 0 ? (r.favHome.ff / r.favHome.total) * 100 : 0,
    favHomeUF: r.favHome?.total > 0 ? (r.favHome.uf / r.favHome.total) * 100 : 0,
    favHomeUU: r.favHome?.total > 0 ? (r.favHome.uu / r.favHome.total) * 100 : 0,
    favAwayFF: r.favAway?.total > 0 ? (r.favAway.ff / r.favAway.total) * 100 : 0,
    favAwayUF: r.favAway?.total > 0 ? (r.favAway.uf / r.favAway.total) * 100 : 0,
    favAwayUU: r.favAway?.total > 0 ? (r.favAway.uu / r.favAway.total) * 100 : 0,
    x: String(r.spread),
  }));

  const series = [
    // { label: "Overall", dataKey: "overall", color: "#1976d2", stack: "A" },
    { label: "Fav Home FF", dataKey: "favHomeFF", color: "#2e2f7dff", stack: "FAVHOME" },
    { label: "Fav Home UF", dataKey: "favHomeUF", color: "#2e7d32", stack: "FAVHOME" },
    { label: "Fav Home UU", dataKey: "favHomeUU", color: "#af2108ff", stack: "FAVHOME" },
    { label: "Fav Away FF", dataKey: "favAwayFF", color: "#2e647dff", stack: "FAVAY" },
    { label: "Fav Away UF", dataKey: "favAwayUF", color: "#64d66aff", stack: "FAVAY" },
    { label: "Fav Away UU", dataKey: "favAwayUU", color: "#af08afff", stack: "FAVAY" },
  ];

  console.log(dataset, series);
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Favorite % by Spread (overall, fav home, fav away)
      </Typography>
      <BarChart
        height={300}
        dataset={dataset}
        series={series}
        xAxis={[{ scaleType: "band", label: "Spread", dataKey: "x" /* overall.map((p) => "" + p.x)*/ }]}
        yAxis={[{ min: 0, max: 100, label: "% Favorite" }]}
        sx={{ height: 360 }}
        // tooltip
      />
    </Box>
  );
}
