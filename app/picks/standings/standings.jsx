import { getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getCurrentWeek, getPickedGames, getThisYearsActiveUsers } from "@/app/utils/db";
import { auth, signIn } from "@/auth";
import { Chip, Avatar, Tooltip } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { BarChart } from "@mui/x-charts/BarChart";
import { getUserStatsForStandings } from "@/app/serverActions/users";
// import { useEffect, useState } from "react";
// import { signIn, useSession } from "next-auth/react";

export default async function Standings() {
  const session = await auth();
  const week = await getCurrentWeek();
  const userStats = await getUserStatsForStandings({ ...week, week: week.week - 1 }, false);

  const series = [];
  for (let i = 1; i < week.week; i++) {
    series.push({ dataKey: "week" + i, label: "Week " + i, stack: "points" });
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <h2>Standings up to week {week.week}</h2>
        {userStats.map((user) => (
          <Tooltip key={user.name} title={"[" + user.points.slice(1).join(", ") + "]"} arrow>
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
            />
          </Tooltip>
        ))}
      </div>
      <div style={{ marginTop: "50px", width: "100%" }}>
        <BarChart
          dataset={userStats}
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
    </>
  );
}
