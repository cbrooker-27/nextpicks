"use client";
import { Skeleton, Tooltip, Chip } from "@mui/material";
import { Sports, LiveTv, Update } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { getAllUserFromDb, getThisWeeksPickedGames, getThisYearsActiveUsers } from "../../utils/db";
import cssClasses from "./viewPicks.module.css";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { useSession } from "next-auth/react";
import { getThisWeeksGamesFromMsf } from "../../lib/msf.js";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export default function ViewPicks() {
  const [pickedGames, setPickedGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: session, status } = useSession();

  const columns: GridColDef[] = [
    { field: "favorite", headerName: "Favorite", width: 70 },
    { field: "spread", headerName: "Spread", width: 35 },
    { field: "underdog", headerName: "Underdog", width: 70 }
  ];
  users.map((user) => {
    columns.push({
      field: user.name,
      headerName: user.name,
      width: 90
    });
  });

  const rows = [
  ];

  gamesWithScores.map((game) => {
    const row: any = { id: game._id, spread: "tbd", favorite: game.home.abbreviation, underdog: game.away.abbreviation };
    users.forEach((user) => {
      const pickedGame = pickedGames.find((picked) => picked._id === game._id);
      if (!pickedGame) {
        row["spread"] = "N/A";
        return;
      }
      const userPick = pickedGame.userChoices.find((pick) => pick.userId === user.name);
      row["spread"] = pickedGame.spread;
      row[user.name] = userPick ? userPick.choice : "NP";
    });
    rows.push(row);
  });

  useEffect(() => {
    async function fetchData() {
      const fetchedPicks = await getThisWeeksPickedGames();
      const users = await getThisYearsActiveUsers();
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
      View Picks
      <DataGrid rows={rows} columns={columns} initialState={{}} sx={{ border: 0 }} />
    </div>
  );
}
