"use client";
import { useEffect, useState } from "react";
import { getCurrentWeek, getPickableGames, updateGameScoresInDb } from "../../utils/db";
import { captureCurrentWeekTeamRecords, updateCurrentWeek } from "../../serverActions/teamRecordSnapshots";
import { Box, Button, MenuItem, Select, FormControl, InputLabel, Skeleton, Typography } from "@mui/material";
import { getGamesForWeekFromMsfWithStatus } from "@/app/lib/msf";

const ChangeWeek = () => {
  const [week, setWeek] = useState("");
  const [newWeek, setNewWeek] = useState("");
  const [season, setSeason] = useState("");
  const [newSeason, setNewSeason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [fetchedPicks, setFetchedPicks] = useState([]);
  const [msfUnavailable, setMsfUnavailable] = useState(false);
  const [changeWeekError, setChangeWeekError] = useState("");
  const [captureStatus, setCaptureStatus] = useState("");
  const [captureInProgress, setCaptureInProgress] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const fetchedWeek = await getCurrentWeek();
      const fetchedPicks = await getPickableGames(fetchedWeek);
      const gamesResult = await getGamesForWeekFromMsfWithStatus(fetchedWeek);
      setWeek(fetchedWeek.week);
      setNewWeek(fetchedWeek.week + 1);
      setSeason(fetchedWeek.season);
      setNewSeason(fetchedWeek.season);
      setGamesWithScores(gamesResult.data);
      setMsfUnavailable(gamesResult.source === "unavailable");
      setFetchedPicks(fetchedPicks);
      setIsLoading(false);
    }
    void fetchData();
  }, []);

  const handleChange = (event) => {
    setNewWeek(event.target.value);
  };

  const handleSeasonChange = (event) => {
    setNewSeason(Number(event.target.value));
  };

  const handleSubmit = async () => {
    setUpdateInProgress(true);
    setChangeWeekError("");
    try {
      // Completed scores are safe to retry if the required snapshot cannot be captured.
      await Promise.all(
        fetchedPicks.map((game) => {
          const msfGameData = gamesWithScores.find((g) => g._id === game._id);
          if (
            msfGameData?.playedStatus === "COMPLETED" &&
            Number.isFinite(msfGameData.awayScore) &&
            Number.isFinite(msfGameData.homeScore)
          ) {
            return updateGameScoresInDb(game._id, {
              playedStatus: msfGameData.playedStatus,
              awayScore: msfGameData.awayScore,
              homeScore: msfGameData.homeScore,
            });
          }
        }),
      );
      const updateResult = await updateCurrentWeek({ week: Number(newWeek), season: Number(newSeason) });
      if (updateResult.modifiedCount !== 1) {
        throw new Error("The week and season were not changed. Confirm the selected period and retry.");
      }
      setWeek(Number(newWeek));
      setSeason(Number(newSeason));
    } catch (error) {
      console.error("Error changing the current week:", error);
      setChangeWeekError(error instanceof Error ? error.message : "Unable to change the current week. Please retry.");
    } finally {
      setUpdateInProgress(false);
    }
  };

  const handleCaptureCurrentWeek = async () => {
    setCaptureInProgress(true);
    setCaptureStatus("");
    try {
      const result = await captureCurrentWeekTeamRecords();
      const outcome = result.status === "already-exists" ? "already exists" : "captured";
      setCaptureStatus(`Week ${result.week}, ${result.season}: snapshot ${outcome} (${result.teamCount} teams).`);
    } catch (error) {
      console.error("Error capturing current-week team records:", error);
      setCaptureStatus(error instanceof Error ? error.message : "Unable to capture team records. Please retry.");
    } finally {
      setCaptureInProgress(false);
    }
  };

  return isLoading ? (
    <Skeleton />
  ) : (
    <div>
      <div>
        <Typography component="p" sx={{ marginBottom: 1 }}>
          Current period: Week {week}, {season}
        </Typography>
        <FormControl variant="outlined" fullWidth>
          <InputLabel id="week-select-label">New Week</InputLabel>
          <Select labelId="week-select-label" value={newWeek} onChange={handleChange} label="New Week">
            {[...Array(18).keys()].map((weekNumber) => (
              <MenuItem key={weekNumber + 1} value={weekNumber + 1} selected={weekNumber + 1 === week ? true : false}>
                Week {weekNumber + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ marginTop: 2, maxWidth: 240 }}>
          <FormControl variant="outlined" fullWidth size="small">
            <InputLabel id="season-select-label">New Year</InputLabel>
            <Select labelId="season-select-label" value={newSeason} onChange={handleSeasonChange} label="New Year">
              {[...Array(5).keys()].map((seasonOffset) => {
                const seasonYear = Number(season) - 2 + seasonOffset;
                return (
                  <MenuItem key={seasonYear} value={seasonYear}>
                    {seasonYear}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          loading={updateInProgress}
          loadingPosition="end"
          disabled={week === newWeek && season === newSeason}
          style={{ marginTop: "16px" }}
        >
          Apply Changes
        </Button>
        <Button
          variant="outlined"
          onClick={handleCaptureCurrentWeek}
          loading={captureInProgress}
          loadingPosition="end"
          disabled={updateInProgress}
          sx={{ mt: 2, ml: 1 }}
        >
          Capture current-week records
        </Button>
      </div>
      {changeWeekError && (
        <Typography role="alert" color="error.main" sx={{ mt: 2 }}>
          {changeWeekError} Resolve the reported issue, then retry.
        </Typography>
      )}
      {captureStatus && (
        <Typography role="status" sx={{ mt: 2 }}>
          {captureStatus}
        </Typography>
      )}
      {msfUnavailable && (
        <Typography role="status" color="warning.main" sx={{ mt: 2 }}>
          MSF scores are unavailable. Any scores already saved for completed games will be kept.
        </Typography>
      )}
      {fetchedPicks.filter((game) => game.homeScore == null).length} Games needing to be finalized for week {week}
      <br />
      {gamesWithScores.filter((game) => game.playedStatus === "COMPLETED").length} Games ready to be finalized
    </div>
  );
};

export default ChangeWeek;
