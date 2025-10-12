import { getTeamStatisticsFromMsf, getThisWeeksGamesFromMsf } from "@/app/lib/msf.js";
import AddGamesForm from "./addGamesForm";
import { Skeleton } from "@mui/material";
// import { useEffect, useState } from "react";
import { getCurrentWeek, getAllGames } from "@/app/utils/db";
import { SeasonStatisticsProvider } from "@/app/context/SeasonStatistics";

export default async function AddGames() {
  // const [thisWeeksGames, setThisWeeksGames] = useState([]);
  // const [teamDetails, setTeamDetails] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  // async function fetchData() {
  const week = await getCurrentWeek();
  const thisWeeksGames = await getThisWeeksGamesFromMsf();
  const teamDetails = await getTeamStatisticsFromMsf(week);
  const seasonData = await getAllGames(week.season);
  // setThisWeeksGames(fetchedGames);
  // setTeamDetails(teamDetails);
  // setIsLoading(false);
  // }
  // fetchData();
  // }, []);

  return (
    <SeasonStatisticsProvider value={{ seasonData: seasonData }}>
      <AddGamesForm games={thisWeeksGames} teamDetails={teamDetails} />
    </SeasonStatisticsProvider>
  );
}
