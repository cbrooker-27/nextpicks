"use client";
import { useEffect, useState } from "react";
import { getCurrentWeek, updateCurrentWeek } from "../../utils/db";
import { Button, MenuItem, Select, FormControl, InputLabel, Skeleton } from "@mui/material";

const ChangeWeek = () => {
  const [week, setWeek] = useState("");
  const [newWeek, setNewWeek] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updateInProgress, setUpdateInProgress] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const fetchedWeek = await getCurrentWeek();
      setWeek(fetchedWeek.week);
      setNewWeek(fetchedWeek.week + 1);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleChange = (event) => {
    setNewWeek(event.target.value);
  };

  const handleSubmit = async () => {
    setUpdateInProgress(true);
    const updateResult = await updateCurrentWeek(newWeek);
    updateResult.modifiedCount === 1 ? setWeek(newWeek) : alert("Error");
    setUpdateInProgress(false);
  };

  return isLoading ? (
    <Skeleton />
  ) : (
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
  );
};

export default ChangeWeek;
