"use client";
import { getTeamStatisticsFromMsf, getThisWeeksGamesFromMsf } from "@/app/lib/msf";
import AddGamesForm from "./addGamesForm";
import { Skeleton } from "@mui/material";
import { useEffect, useState } from "react";
import { getCurrentWeek } from "@/app/utils/db";

export default function AddGames() {
  const [thisWeeksGames, setThisWeeksGames] = useState([]);
  const [teamDetails, setTeamDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const week = await getCurrentWeek();
      const fetchedGames = await getThisWeeksGamesFromMsf();
      const teamDetails = await getTeamStatisticsFromMsf(week);
      setThisWeeksGames(fetchedGames);
      setTeamDetails(teamDetails);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return isLoading ? <Skeleton /> : <AddGamesForm games={thisWeeksGames} teamDetails={teamDetails} />;
}
