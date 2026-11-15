"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { getPickEditHistory } from "@/app/serverActions/pickEditHistory";
import styles from "./pickEditHistory.module.css";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const choiceLabels = {
  ff: "Favorite covers",
  uf: "Underdog covers",
  uu: "Underdog wins",
};

export default function PickEditHistory({ initialData }) {
  const [data, setData] = useState(initialData);
  const [season, setSeason] = useState("");
  const [week, setWeek] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(data.totalEvents / data.pageSize));

  async function loadHistory(page = 1, filters = { season, week, userId }) {
    setIsLoading(true);
    setError("");
    try {
      const result = await getPickEditHistory({
        ...(filters.season ? { season: Number(filters.season) } : {}),
        ...(filters.week ? { week: Number(filters.week) } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
        page,
      });
      setData(result);
    } catch (loadError) {
      setError(loadError.message || "Unable to load pick-edit history.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyFilters(event) {
    event.preventDefault();
    loadHistory(1);
  }

  function clearFilters() {
    setSeason("");
    setWeek("");
    setUserId("");
    loadHistory(1, { season: "", week: "", userId: "" });
  }

  return (
    <Box component="main" className={styles.root}>
      <Typography variant="h4" component="h1" className={styles.title}>
        User Pick Edit History
      </Typography>
      <Typography color="text.secondary" className={styles.description}>
        Review changes players made to their picks after first submitting them. Admin overrides are not included.
      </Typography>

      <Box className={styles.metrics}>
        <Paper variant="outlined" className={styles.metric}>
          <Typography variant="body2" color="text.secondary">
            Pick changes
          </Typography>
          <Typography variant="h5" component="p">{data.totalEvents}</Typography>
        </Paper>
        <Paper variant="outlined" className={styles.metric}>
          <Typography variant="body2" color="text.secondary">
            Unique player/game picks changed
          </Typography>
          <Typography variant="h5" component="p">{data.distinctPicks}</Typography>
        </Paper>
      </Box>

      <Box component="form" onSubmit={applyFilters} className={styles.filters}>
        <TextField
          label="Season"
          type="number"
          value={season}
          onChange={(event) => setSeason(event.target.value)}
          slotProps={{ htmlInput: { min: 1900, max: 2200 } }}
        />
        <TextField
          label="Week"
          type="number"
          value={week}
          onChange={(event) => setWeek(event.target.value)}
          slotProps={{ htmlInput: { min: 1, max: 30 } }}
        />
        <FormControl>
          <InputLabel id="history-player-label">Player</InputLabel>
          <Select
            labelId="history-player-label"
            value={userId}
            label="Player"
            onChange={(event) => setUserId(event.target.value)}
          >
            <MenuItem value="">All players</MenuItem>
            {data.players.map((player) => (
              <MenuItem key={player} value={player}>
                {player}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box className={styles.actions}>
          <Button type="submit" variant="contained" disabled={isLoading}>
            Apply filters
          </Button>
          <Button type="button" onClick={clearFilters} disabled={isLoading}>
            Clear
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" className={styles.message}>{error}</Alert>}
      {data.events.length === 0 ? (
        <Alert severity="info" className={styles.message}>
          No pick changes match these filters.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="User pick edit history">
            <TableHead>
              <TableRow>
                <TableCell>Changed</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Season / week</TableCell>
                <TableCell>Game ID</TableCell>
                <TableCell>Previous pick</TableCell>
                <TableCell>New pick</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{dateFormatter.format(new Date(event.changedAt))}</TableCell>
                  <TableCell>{event.userId}</TableCell>
                  <TableCell>{`${event.season} / ${event.week}`}</TableCell>
                  <TableCell>{event.gameId}</TableCell>
                  <TableCell>{choiceLabels[event.previousChoice] || event.previousChoice}</TableCell>
                  <TableCell>{choiceLabels[event.newChoice] || event.newChoice}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box className={styles.pagination}>
        <Button
          onClick={() => loadHistory(data.page - 1)}
          disabled={isLoading || data.page <= 1}
        >
          Previous
        </Button>
        <Typography aria-live="polite">
          Page {data.page} of {totalPages}
        </Typography>
        <Button
          onClick={() => loadHistory(data.page + 1)}
          disabled={isLoading || data.page >= totalPages}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
