"use client";
import { useEffect, useState } from "react";
import { getCurrentWeek, updateCurrentWeek } from "../../../utils/db";
import {
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
} from "@mui/material";

const ChangeWeek = () => {
  const [week, setWeek] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const fetchedWeek = await getCurrentWeek();
      setWeek(fetchedWeek.week);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleChange = (event) => {
    setWeek(event.target.value);
  };

  const handleSubmit = async () => {
    // Add your database update logic here
    await updateCurrentWeek(week);
    console.log(`Week changed to: ${week}`);
  };

  return isLoading ? (
    <div>
      <Skeleton />
      ...
    </div>
  ) : (
    <div>
      <FormControl variant="outlined" fullWidth>
        <InputLabel id="week-select-label">Week</InputLabel>
        <Select
          labelId="week-select-label"
          value={week}
          onChange={handleChange}
          label="Week"
        >
          {[...Array(18).keys()].map((weekNumber) => (
            <MenuItem
              key={weekNumber + 1}
              value={weekNumber + 1}
              selected={weekNumber + 1 === week ? true : false}
            >
              Week {weekNumber + 1}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        style={{ marginTop: "16px" }}
      >
        Change Week
      </Button>
    </div>
  );
};

export default ChangeWeek;
