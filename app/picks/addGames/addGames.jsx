"use client";
import { getThisWeeksGamesFromMsf } from "@/app/lib/msf";
import AddGamesForm from "./addGamesForm";
import { Skeleton } from "@mui/material";
import { useEffect, useState } from "react";

export default function AddGames() {
  const [thisWeeksGames, setThisWeeksGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const fetchedGames = await getThisWeeksGamesFromMsf();
      setThisWeeksGames(fetchedGames);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return isLoading ? <Skeleton /> : <AddGamesForm games={thisWeeksGames} />;
}
