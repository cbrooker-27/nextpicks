"use client";
import { getTeamStats } from "./actions";
import { getOutcomeStats } from "./actions";
import { getSpreadStats } from "./actions";
import TeamChart from "./components/TeamChart";
import OutcomeChart from "./components/OutcomeChart";
import SpreadChart from "./components/SpreadChart";
import { useState, useEffect } from "react";
import { Button, Box, Typography, Alert } from "@mui/material";

export default function Page() {
  const [teamData, setTeamData] = useState([]);
  const [outcomeData, setOutcomeData] = useState([]);
  const [spreadData, setSpreadData] = useState([]);
  const [mode, setMode] = useState("summarized"); // 'summarized' or 'individual'
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load all stats concurrently
    Promise.all([
      getTeamStats().catch((e) => {
        setError(e.message);
        return [];
      }),
      getOutcomeStats().catch((e) => {
        setError(e.message);
        return [];
      }),
      getSpreadStats(mode).catch((e) => {
        setError(e.message);
        return [];
      }),
    ]).then(([team, outcome, spread]) => {
      setTeamData(team);
      setOutcomeData(outcome);
      setSpreadData(spread);
    });
  }, [mode]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 2, background: "rgba(0,0,0,0.04)", borderRadius: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Analytics
      </Typography>
      <Button
        variant="contained"
        onClick={() => setMode(mode === "summarized" ? "individual" : "summarized")}
        sx={{ mb: 2 }}
      >
        Switch to {mode === "summarized" ? "Raw" : "Bucket"} View
      </Button>
      <TeamChart data={teamData} />
      <OutcomeChart data={outcomeData} />
      <SpreadChart data={spreadData} mode={mode} />
    </Box>
  );
}
