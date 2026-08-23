"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { updateActiveSeason } from "../../serverActions/activeSeasons";

export default function ActiveSeasonsForm({ users, seasons }) {
  const [season, setSeason] = useState(seasons[0] || "");
  const [selectedUserIds, setSelectedUserIds] = useState(() =>
    users.filter((user) => user.activeSeasons?.includes(seasons[0])).map((user) => user._id.toString()),
  );
  const [status, setStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleSeasonChange(event) {
    const nextSeason = Number(event.target.value);
    setSeason(nextSeason);
    // Each season has its own membership list, so reload checkbox state from the original user snapshot.
    setSelectedUserIds(
      users.filter((user) => user.activeSeasons?.includes(nextSeason)).map((user) => user._id.toString()),
    );
    setStatus(null);
  }

  function handleUserChange(userId) {
    setSelectedUserIds((currentIds) =>
      currentIds.includes(userId) ? currentIds.filter((id) => id !== userId) : [...currentIds, userId],
    );
    setStatus(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);
    try {
      const result = await updateActiveSeason({ season, selectedUserIds });
      setStatus({ severity: "success", message: `Updated ${result.modifiedCount} user record(s).` });
    } catch (error) {
      setStatus({ severity: "error", message: error.message || "Unable to update active seasons." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box component="main" sx={{ maxWidth: 760, mx: "auto", p: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Manage Active Seasons
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Select a season, choose its users, and save the complete membership list.
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel id="active-season-label">Season</InputLabel>
            <Select labelId="active-season-label" value={season} label="Season" onChange={handleSeasonChange}>
              {seasons.map((availableSeason) => (
                <MenuItem key={availableSeason} value={availableSeason}>
                  {availableSeason}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Users ({selectedUserIds.length} selected of {users.length})
            </Typography>
            <Stack>
              {users.map((user) => {
                const userId = user._id.toString();
                return (
                  <FormControlLabel
                    key={userId}
                    control={
                      <Checkbox checked={selectedUserIds.includes(userId)} onChange={() => handleUserChange(userId)} />
                    }
                    label={user.name || user.email}
                  />
                );
              })}
            </Stack>
          </Paper>
          {status && <Alert severity={status.severity}>{status.message}</Alert>}
          <Button type="submit" variant="contained" disabled={isSaving || !season}>
            {isSaving ? "Saving..." : "Save active season users"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
