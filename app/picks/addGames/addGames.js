"use client";
import { getThisWeeksGames } from "@/lib/msf";
import AddGamesForm from "./addGamesForm";
import { Skeleton } from "@mui/material";
import { useEffect, useState } from "react";

export default function AddGames() {
  const [thisWeeksGames, setThisWeeksGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const fetchedGames = await getThisWeeksGames();
      setThisWeeksGames(fetchedGames);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return isLoading ? <Skeleton /> : <AddGamesForm games={thisWeeksGames} />;
}
