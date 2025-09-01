"use client";
import { getThisWeeksGamesFromMsf } from "@/app/lib/msf";
import { getAllUserFromDb, getThisWeeksPickedGames } from "@/app/utils/db";
import GameScoreTile from "@/app/components/games/gameScoreTile";
import { Skeleton } from "@mui/material";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function EnterScores() {
  const [pickedGames, setPickedGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  useEffect(() => {
    async function fetchData() {
      const fetchedPicks = await getThisWeeksPickedGames();
      const users = await getAllUserFromDb();
      const gamesWithScores = await getThisWeeksGamesFromMsf();
      setUsers(JSON.parse(users));
      setPickedGames(JSON.parse(fetchedPicks));
      setGamesWithScores(gamesWithScores);
      setIsLoading(false);
    }
    void fetchData();
  }, []);

  return isLoading ? (
    <Skeleton />
  ) : (
    <div>
      {pickedGames.map((game) => {
        const gameData = gamesWithScores.find((g) => g._id === game._id);
        return <GameScoreTile game={game} liveDetails={gameData} key={game._id} users={users} />;
      })}
    </div>
  );
}
