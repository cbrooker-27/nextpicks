"use client";
import { useEffect, useState } from "react";
import { getCurrentWeek, getPickableGames, updateCurrentWeek, updateGameInDb } from "../../utils/db";
import { Button, MenuItem, Select, FormControl, InputLabel, Skeleton } from "@mui/material";
import { getGamesForWeekFromMsf } from "@/app/lib/msf";

const ChangeWeek = () => {
  const [week, setWeek] = useState("");
  const [newWeek, setNewWeek] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [fetchedPicks, setFetchedPicks] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const fetchedWeek = await getCurrentWeek();
      const fetchedPicks = await getPickableGames(fetchedWeek);
      const gamesWithScores = await getGamesForWeekFromMsf(fetchedWeek);
      setWeek(fetchedWeek.week);
      setNewWeek(fetchedWeek.week + 1);
      setGamesWithScores(gamesWithScores);
      setFetchedPicks(fetchedPicks);
      setIsLoading(false);
    }
    void fetchData();
  }, [week]);

  const handleChange = (event) => {
    setNewWeek(event.target.value);
  };

  const handleSubmit = async () => {
    setUpdateInProgress(true);
    // Before changing the week, update all games in the DB with latest scores from MSF
    await Promise.all(
      fetchedPicks.map((game) => {
        const msfGameData = gamesWithScores.find((g) => g._id === game._id);
        if (msfGameData.playedStatus === "COMPLETED" && game.playedStatus !== "COMPLETED") {
          game.playedStatus = msfGameData.playedStatus;
          game.awayScore = msfGameData.awayScore;
          game.homeScore = msfGameData.homeScore;
          updateGameInDb(game);
        }
      })
    );
    const updateResult = await updateCurrentWeek(newWeek);
    updateResult.modifiedCount === 1 ? setWeek(newWeek) : alert("Error");
    setUpdateInProgress(false);
  };

  return isLoading ? (
    <Skeleton />
  ) : (
    <div>
      <div>
        Current Week: {week}
        <FormControl variant="outlined" fullWidth>
          <InputLabel id="week-select-label">Week</InputLabel>
          <Select labelId="week-select-label" value={newWeek} onChange={handleChange} label="Week">
            {[...Array(18).keys()].map((weekNumber) => (
              <MenuItem key={weekNumber + 1} value={weekNumber + 1} selected={weekNumber + 1 === week ? true : false}>
                Week {weekNumber + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          loading={updateInProgress}
          loadingPosition="end"
          disabled={week === newWeek ? true : false}
          style={{ marginTop: "16px" }}
        >
          Change Week
        </Button>
      </div>
      {fetchedPicks.filter((game) => game.homeScore === null).length} Games needing to be finalized for week {week}
      <br />
      {gamesWithScores.filter((game) => game.playedStatus === "COMPLETED").length} Games ready to be finalized
    </div>
  );
};

export default ChangeWeek;
