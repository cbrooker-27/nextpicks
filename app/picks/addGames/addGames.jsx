"use client";
import {
  getGameSpreadsFromMsf,
  getThisWeeksGamesFromMsf,
} from "@/app/lib/msf.js";
import AddGamesForm from "./addGamesForm";
import { Skeleton } from "@mui/material";
import { useEffect, useState } from "react";
import { getCurrentWeek } from "@/app/utils/db";

export default function AddGames() {
  const [thisWeeksGames, setThisWeeksGames] = useState([]);
  const [gameSpreads, setGameSpreads] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const week = await getCurrentWeek();
      const [fetchedGames, gameSpreads] = await Promise.all([
        getThisWeeksGamesFromMsf(),
        getGameSpreadsFromMsf(week),
      ]);
      setThisWeeksGames(fetchedGames);
      setGameSpreads(gameSpreads);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return isLoading ? (
    <Skeleton />
  ) : (
    <AddGamesForm games={thisWeeksGames} gameSpreads={gameSpreads} />
  );
}
