"use client";
import { getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getCurrentWeek, getPickedGames, getThisYearsActiveUsers } from "@/app/utils/db";
import { Chip, Avatar, Tooltip, Switch, FormControlLabel, Box } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { BarChart } from "@mui/x-charts/BarChart";
import StandingsLineChart from "./StandingsLineChart";
import { getUserStatsForStandings } from "@/app/serverActions/users";
import ProfileModal from "@/app/components/profileModal";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { SmartToy } from "@mui/icons-material";

export default function Standings() {
  const { data: session, status } = useSession();
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [week, setWeek] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [includeNpc, setIncludeNpc] = useState(true);
  const [includeAdminPicks, setIncludeAdminPicks] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const currentWeek = await getCurrentWeek();
      const stats = await getUserStatsForStandings({ ...currentWeek, week: currentWeek.week - 1 }, false);
      setUserStats(stats);
      setWeek(currentWeek);
    }
    void fetchData();
  }, []);

  if (week === null) {
    return <div>Loading...</div>;
  }

  const series = [];
  for (let i = 1; i < week.week; i++) {
    series.push({
      dataKey: "week" + i,
      label: "Week " + i,
      stack: "points",
      valueFormatter: (value, { dataIndex }) => {
        const adminPoints = visibleUserStats[dataIndex]?.[`adminPointsWeek${i}`] || 0;
        const adminNote = includeAdminPicks ? "points from admin picks" : "points from admin picks excluded";
        return adminPoints > 0 ? `${value}* (${adminPoints} ${adminNote})` : String(value ?? 0);
      },
    });
  }

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // Filter out NPC users if toggle is off
  const filteredUserStats = includeNpc ? userStats : userStats.filter((user) => !user.npc);
  const visibleUserStats = filteredUserStats
    .map((user) => {
      const visibleUser = {
        ...user,
        totalPoints: user.totalPoints - (includeAdminPicks ? 0 : user.adminPoints || 0),
      };
      for (let i = 1; i < week.week; i++) {
        const adminWeekPoints = user[`adminPointsWeek${i}`] || 0;
        visibleUser[`week${i}`] = (user[`week${i}`] || 0) - (includeAdminPicks ? 0 : adminWeekPoints);
      }
      return visibleUser;
    })
    .sort((first, second) => second.totalPoints - first.totalPoints);
  const hasAdminPicks = userStats.some((user) => user.hasAdminPicks);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Standings up to week {week.week}</h2>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
            {hasAdminPicks && (
              <FormControlLabel
                control={
                  <Switch
                    checked={includeAdminPicks}
                    onChange={(event) => setIncludeAdminPicks(event.target.checked)}
                  />
                }
                label="Show points from admin picks"
              />
            )}
            <FormControlLabel
              control={<Switch checked={includeNpc} onChange={(e) => setIncludeNpc(e.target.checked)} />}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  Include NPCs
                  <SmartToy sx={{ fontSize: 18 }} />
                </Box>
              }
            />
          </Box>
        </div>
        {visibleUserStats.map((user) => {
          const latestCompletedWeek = week.week - 1;
          const latestWeekAdminPoints =
            latestCompletedWeek > 0 ? user[`adminPointsWeek${latestCompletedWeek}`] || 0 : null;
          const tooltip = [
            `${user.adminPoints} total points from admin picks`,
            latestCompletedWeek > 0
              ? `${latestWeekAdminPoints} points from admin picks in Week ${latestCompletedWeek}`
              : "No completed-week admin points yet",
          ].join("; ");
          const annotatedTooltip = includeAdminPicks
            ? tooltip
            : `${tooltip} (excluded from displayed score)`;

          return (
            <Tooltip key={user.name} title={user.adminPoints > 0 ? annotatedTooltip : ""} arrow>
              <Chip
                avatar={
                  <Avatar
                    alt={user.name}
                    src={user?.image}
                    sx={{
                      border: user?.npc ? "2px solid orange" : "2px solid transparent",
                      boxSizing: "border-box",
                    }}
                  >
                    {user?.name.substring(0, 1)}
                  </Avatar>
                }
                label={`${user.name} - ${user.totalPoints}${user.adminPoints > 0 ? "*" : ""}`}
                variant={user.name === session?.user?.name ? "filled" : "outlined"}
                color={user.name === session?.user?.name ? "primary" : "default"}
                onClick={() => handleOpenModal(user)}
                sx={{
                  ...(user?.npc ? { border: "1px solid orange" } : {}),
                  ...(user.adminPoints > 0 ? { border: "2px solid #d32f2f" } : {}),
                }}
              />
            </Tooltip>
          );
        })}
      </div>
      <div style={{ marginTop: "50px", width: "100%" }}>
        {/* Line chart: users are series, x axis is week, y axis is points */}
        <StandingsLineChart
          userStats={visibleUserStats}
          maxWeek={week.week - 1}
          maxSeries={10}
          includeAdminPicks={includeAdminPicks}
        />

        <BarChart
          dataset={visibleUserStats}
          series={series}
          tooltip={{ trigger: "item" }}
          //xAxis={[{ width: 50 }]}
          yAxis={[{ scaleType: "band", dataKey: "name", width: 70 }]}
          layout={"horizontal"}
          height={550}
          borderRadius={10}
          margin={{ left: 0 }}
        />
      </div>
      <ProfileModal open={modalOpen} onClose={handleCloseModal} user={selectedUser} />
    </>
  );
}
