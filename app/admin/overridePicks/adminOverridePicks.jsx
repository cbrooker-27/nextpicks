"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { getAdminPickGames, getAdminPickOptions, saveAdminOverridePicks } from "@/app/serverActions/adminPicks";

const periodKey = (period) => `${period.season}-${period.week}`;

function choiceLabel(game, choice) {
  if (choice === "ff") return `${game.favoriteName} by more than ${game.spread}`;
  if (choice === "uf") return `${game.favoriteName} by less than ${game.spread}`;
  if (choice === "uu") return `${game.underdogName} wins`;
  return "";
}

export default function AdminOverridePicks() {
  const [options, setOptions] = useState({ users: [], periods: [] });
  const [userId, setUserId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [games, setGames] = useState([]);
  const [draftChoices, setDraftChoices] = useState({});
  const [showPickedGames, setShowPickedGames] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    getAdminPickOptions()
      .then((result) => {
        if (!isCurrent) return;
        setOptions(result);
        setUserId(result.users[0]?.name || "");
        setSelectedPeriod(result.periods[0] ? periodKey(result.periods[0]) : "");
      })
      .catch((error) => {
        if (isCurrent) setStatus({ severity: "error", message: error.message || "Unable to load admin pick options." });
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const period = options.periods.find((availablePeriod) => periodKey(availablePeriod) === selectedPeriod);
  const visibleGames = showPickedGames ? games : games.filter((game) => !game.choice);
  const pickedGameCount = games.filter((game) => Boolean(game.choice)).length;
  const changedPicks = visibleGames
    .filter((game) => draftChoices[game.id] && draftChoices[game.id] !== game.choice)
    .map((game) => ({ gameId: game.id, choice: draftChoices[game.id] }));

  function clearLoadedGames() {
    setGames([]);
    setDraftChoices({});
    setStatus(null);
  }

  async function loadGames() {
    if (!period || !userId) return;
    setIsLoadingGames(true);
    clearLoadedGames();
    try {
      const loadedGames = await getAdminPickGames({ ...period, userId });
      setGames(loadedGames);
      setDraftChoices(Object.fromEntries(loadedGames.map((game) => [game.id, game.choice])));
      if (loadedGames.length === 0) {
        setStatus({ severity: "info", message: `No locked games found for Week ${period.week}, ${period.season}.` });
      }
    } catch (error) {
      setStatus({ severity: "error", message: error.message || "Unable to load locked games." });
    } finally {
      setIsLoadingGames(false);
    }
  }

  async function savePicks() {
    if (!period || !userId || changedPicks.length === 0) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await saveAdminOverridePicks({ ...period, userId, picks: changedPicks });
      const savedGameIds = new Set(changedPicks.map((pick) => pick.gameId));
      setGames((currentGames) =>
        currentGames.map((game) =>
          savedGameIds.has(game.id) ? { ...game, choice: draftChoices[game.id], adminOverride: true } : game,
        ),
      );
      setStatus({ severity: "success", message: `Saved ${changedPicks.length} override pick(s) for ${userId}.` });
    } catch (error) {
      setStatus({ severity: "error", message: error.message || "Unable to save override picks." });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <Typography sx={{ p: 3 }}>Loading player pick options...</Typography>;

  return (
    <Box component="main" sx={{ maxWidth: 980, mx: "auto", p: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Admin Player Picks
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Record a pick for a player after a game has locked. The save time will be recorded and marked as an admin
        override.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3, alignItems: "stretch" }}>
        <FormControl fullWidth>
          <InputLabel id="override-player-label">Pick for player</InputLabel>
          <Select
            labelId="override-player-label"
            id="override-player"
            value={userId}
            label="Pick for player"
            disabled={isLoadingGames || isSaving}
            onChange={(event) => {
              clearLoadedGames();
              setUserId(event.target.value);
            }}
          >
            {options.users.map((user) => (
              <MenuItem key={user.name} value={user.name}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="override-period-label">Week and season</InputLabel>
          <Select
            labelId="override-period-label"
            id="override-period"
            value={selectedPeriod}
            label="Week and season"
            disabled={isLoadingGames || isSaving}
            onChange={(event) => {
              clearLoadedGames();
              setSelectedPeriod(event.target.value);
            }}
          >
            {options.periods.map((availablePeriod) => (
              <MenuItem key={periodKey(availablePeriod)} value={periodKey(availablePeriod)}>
                Week {availablePeriod.week}, Season {availablePeriod.season}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={loadGames}
          disabled={!userId || !period || isLoadingGames}
          sx={{ minWidth: { sm: 155 } }}
        >
          {isLoadingGames ? <CircularProgress size={23} color="inherit" /> : "Load locked games"}
        </Button>
      </Stack>

      {userId && period && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderLeft: 4, borderLeftColor: "warning.main" }}>
          <Typography variant="h6" component="h2">
            Picks for {userId}
          </Typography>
          <Typography color="text.secondary">
            Week {period.week}, Season {period.season}
          </Typography>
        </Paper>
      )}

      {status && (
        <Alert severity={status.severity} sx={{ mb: 2 }}>
          {status.message}
        </Alert>
      )}
      {!isLoadingGames && games.length === 0 && period && !status && (
        <Typography color="text.secondary">Load the locked games for the selected player and week.</Typography>
      )}
      {games.length > 0 && (
        <FormControlLabel
          sx={{ mb: 1 }}
          control={<Switch checked={showPickedGames} onChange={(event) => setShowPickedGames(event.target.checked)} />}
          label={`Show currently picked games (${pickedGameCount})`}
        />
      )}
      {games.length > 0 && visibleGames.length === 0 && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          All locked games already have picks. Turn on “Show currently picked games” to review or change them.
        </Typography>
      )}
      {visibleGames.map((game) => (
        <Paper key={game.id} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 1.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.5, justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" component="h3">
                {game.awayName} at {game.homeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(game.startTime).toLocaleString()}
                {game.location ? ` · ${game.location}` : ""}
              </Typography>
            </Box>
            {game.choice && (
              <Chip size="small" color="primary" label={`Current pick: ${choiceLabel(game, game.choice)}`} />
            )}
            {draftChoices[game.id] && draftChoices[game.id] !== game.choice && (
              <Chip
                size="small"
                color="warning"
                label={`Unsaved selection: ${choiceLabel(game, draftChoices[game.id])}`}
              />
            )}
            {game.adminOverride && <Chip size="small" color="warning" label="Existing admin override" />}
          </Stack>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={draftChoices[game.id] || ""}
            disabled={isSaving}
            onChange={(_, choice) => {
              if (choice) setDraftChoices((current) => ({ ...current, [game.id]: choice }));
            }}
            aria-label={`Pick for ${userId}, Week ${period.week}, ${game.awayName} at ${game.homeName}`}
          >
            <ToggleButton value="ff" aria-label="favorite covers">
              {game.favoriteName} by more than {game.spread}
            </ToggleButton>
            {game.spread !== 0.5 && (
              <ToggleButton value="uf" aria-label="favorite wins without covering">
                {game.favoriteName} by less than {game.spread}
              </ToggleButton>
            )}
            <ToggleButton value="uu" aria-label="underdog wins">
              {game.underdogName} wins
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      ))}

      {visibleGames.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: "flex-end", alignItems: "center" }}>
          <Typography color="text.secondary">{changedPicks.length} changed pick(s)</Typography>
          <Button variant="contained" color="warning" onClick={savePicks} disabled={!changedPicks.length || isSaving}>
            {isSaving ? "Saving..." : `Save picks for ${userId}`}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
