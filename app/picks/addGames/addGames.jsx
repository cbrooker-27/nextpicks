"use client";
import {
  getGameSpreadsFromMsf,
  getTeamStatisticsFromMsf,
  getThisWeeksGamesFromMsf,
} from "@/app/lib/msf.js";
import AddGamesForm from "./addGamesForm";
import { Skeleton } from "@mui/material";
import { useEffect, useState } from "react";
import { getCurrentWeek, getAllGames } from "@/app/utils/db";
import { SeasonStatisticsProvider } from "@/app/context/SeasonStatistics";

export default function AddGames() {
  const [thisWeeksGames, setThisWeeksGames] = useState([]);
  const [gameSpreads, setGameSpreads] = useState({});
  const [teamDetails, setTeamDetails] = useState([]);
  const [seasonData, setSeasonData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const week = await getCurrentWeek();
      const [fetchedGames, teamDetails, seasonData, gameSpreads] = await Promise.all([
        getThisWeeksGamesFromMsf(),
        getTeamStatisticsFromMsf(week),
        getAllGames(week.season),
        getGameSpreadsFromMsf(week),
      ]);
      setThisWeeksGames(fetchedGames);
      setTeamDetails(teamDetails);
      setSeasonData(seasonData);
      setGameSpreads(gameSpreads);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return isLoading ? (
    <Skeleton />
  ) : (
    <SeasonStatisticsProvider value={{ seasonData: seasonData }}>
      <AddGamesForm games={thisWeeksGames} teamDetails={teamDetails} gameSpreads={gameSpreads} />
    </SeasonStatisticsProvider>
  );
}
