"use client";
import { useEffect, useState } from "react";
import { getAllUserFromDb, getCurrentWeek, getThisWeeksPickedGames } from "./utils/db";
import { useSession } from "next-auth/react";
import { Skeleton } from "@mui/material";
import { set } from "zod";

export default function Home() {
  const [pickedGames, setPickedGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [season, setSeason] = useState(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchData() {
      const fetchedPicks = await getThisWeeksPickedGames();
      const users = await getAllUserFromDb();
      const currentWeek = await getCurrentWeek();
      setSeason("" + currentWeek.season);
      setUsers(JSON.parse(users));
      setPickedGames(JSON.parse(fetchedPicks));
      setIsLoading(false);
    }
    void fetchData();
  }, []);
  let usersWhoPicked = [];
  let usersForThisSeason = [];
  if (!isLoading) {
    usersForThisSeason = users.filter((user) => user.activeSeasons?.includes(season));
    usersWhoPicked = usersForThisSeason.filter((user) =>
      pickedGames.some((game) => game.userChoices.some((choice) => choice.userId === user.name))
    );
  }

  return isLoading ? (
    <Skeleton />
  ) : (
    <>
      <p>Users who picked games this week:</p>
      {usersWhoPicked.map((user) => (
        <div key={user.name}>{user.name}</div>
      ))}
      <p>Users who didn't pick yet this week:</p>
      {usersForThisSeason
        .filter((user) => !usersWhoPicked.includes(user))
        .map((user) => (
          <div key={user.name}>{user.name}</div>
        ))}
    </>
  );
}
