"use client";
import { Avatar, Skeleton, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { getThisWeeksPickedGames, getThisYearsActiveUsers } from "../../utils/db";
import { getThisWeeksGamesFromMsf } from "../../lib/msf.js";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export default function ViewPicks() {
  const [pickedGames, setPickedGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns: GridColDef[] = [
    {
      field: "favorite",
      headerName: "Favorite",
      width: 72,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.row.favoriteName || params.value}>
          <Avatar src={params.row.favoriteLogo} alt={`${params.value} logo`} sx={{ width: 30, height: 30 }}>
            {params.value}
          </Avatar>
        </Tooltip>
      ),
    },
    { field: "spread", headerName: "Spread", width: 70 },
    {
      field: "underdog",
      headerName: "Underdog",
      width: 72,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.row.underdogName || params.value}>
          <Avatar src={params.row.underdogLogo} alt={`${params.value} logo`} sx={{ width: 30, height: 30 }}>
            {params.value}
          </Avatar>
        </Tooltip>
      ),
    },
  ];
  users.forEach((user) => {
    columns.push({
      field: user.name,
      headerName: user.name,
      width: 90
    });
  });

  const rows = [
  ];

  gamesWithScores.forEach((game) => {
    const pickedGame = pickedGames.find((picked) => picked._id === game._id);
    const favorite = pickedGame?.awayFavorite ? game.away : game.home;
    const underdog = pickedGame?.awayFavorite ? game.home : game.away;
    const row: any = {
      id: game._id,
      spread: pickedGame ? pickedGame.spread : "N/A",
      favorite: favorite.abbreviation,
      favoriteName: favorite.name,
      favoriteLogo: favorite.officialLogoImageSrc,
      underdog: underdog.abbreviation,
      underdogName: underdog.name,
      underdogLogo: underdog.officialLogoImageSrc,
    };
    users.forEach((user) => {
      if (!pickedGame) {
        row[user.name] = "NP";
        return;
      }
      const userPick = pickedGame.userChoices.find((pick) => pick.userId === user.name);
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
