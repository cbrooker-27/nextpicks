"use client";
import { getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getCurrentWeek, getPickedGames, getThisYearsActiveUsers } from "@/app/utils/db";
import { Chip, Avatar, Tooltip, Switch, FormControlLabel, Box } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { BarChart } from "@mui/x-charts/BarChart";
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

  useEffect(() => {
    async function fetchData() {
      const currentWeek = await getCurrentWeek();
      const stats = await getUserStatsForStandings(currentWeek, true);
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
    series.push({ dataKey: "week" + i, label: "Week " + i, stack: "points" });
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

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Standings up to week {week.week}</h2>
          <FormControlLabel
            control={<Switch checked={includeNpc} onChange={(e) => setIncludeNpc(e.target.checked)} />}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                Include NPCs
                <SmartToy sx={{ fontSize: 18 }} />
              </Box>
            }
          />
        </div>
        {filteredUserStats.map((user) => (
          <Chip
            key={user.name}
            avatar={
              <Avatar alt={user.name} src={user?.image}>
                {user?.name.substring(0, 1)}
              </Avatar>
            }
            label={user.name + " - " + user.totalPoints}
            variant={user.name === session?.user?.name ? "filled" : "outlined"}
            color={user.name === session?.user?.name ? "primary" : "default"}
            onClick={() => handleOpenModal(user)}
          />
        ))}
      </div>
      <div style={{ marginTop: "50px", width: "100%" }}>
        <BarChart
          dataset={filteredUserStats}
          series={series}
          //xAxis={[{ width: 50 }]}
          yAxis={[{ scaleType: "band", dataKey: "name", width: 70 }]}
          layout={"horizontal"}
          height={550}
          borderRadius={10}
          margin={{ left: 0 }}
        />
        {/* <LineChart
          dataset={activeUsers}
          series={series}
          //xAxis={[{ width: 50 }]}
          yAxis={[{ scaleType: "band", dataKey: "name", width: 70 }]}
          layout={"horizontal"}
          height={550}
          borderRadius={10}
          margin={{ left: 0 }}
        /> */}
      </div>
      <ProfileModal open={modalOpen} onClose={handleCloseModal} user={selectedUser} />
    </>
  );
}
