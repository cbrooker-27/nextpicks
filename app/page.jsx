"use client";
import { useEffect, useState } from "react";
import { getAllGames, getAllUserFromDb, getCurrentWeek, getThisWeeksPickedGames } from "./utils/db";
import { useSession } from "next-auth/react";
import { Box, Card, CardContent, Skeleton, Tooltip, Avatar, AvatarGroup, Typography } from "@mui/material";
import cssStyles from "./page.module.css";
import { SeasonStatisticsProvider } from "./context/SeasonStatistics";
import WeeklyScoreCard from "./components/WeeklyScoreCard";
import { getUserStatsForStandings } from "./serverActions/users";

export default function Home() {
  const [pickedGames, setPickedGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [week, setWeek] = useState(null);
  const [seasonData, setSeasonData] = useState([]);
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const fetchedPicks = await getThisWeeksPickedGames();
      const users = await getAllUserFromDb();
      const currentWeek = await getCurrentWeek();
      setWeek(currentWeek);
      setUsers(JSON.parse(users));
      setPickedGames(JSON.parse(fetchedPicks));
      setIsLoading(false);
    }
    void fetchData();
  }, []);

  useEffect(() => {
    async function fetchUserStats() {
      const stats = await getUserStatsForStandings(week);
      setUserStats(stats);
    }
    if (week) void fetchUserStats();
  }, [week]);

  useEffect(() => {
    async function getSeasonData() {
      setSeasonData(await getAllGames(week.season));
    }
    if (!isLoading) {
      void getSeasonData();
    }
  }, [isLoading, week]);

  let usersWhoPicked = [];
  let usersForThisSeason = [];
  if (!isLoading) {
    usersForThisSeason = users.filter((user) => user.activeSeasons?.includes("" + week.season));
    usersWhoPicked = usersForThisSeason.filter((user) =>
      pickedGames.some((game) => game.userChoices.some((choice) => choice.userId === user.name))
    );
  }

  const pickedThisWeek = usersWhoPicked.some((user) => user.name === session?.user?.name);

  return isLoading ? (
    <Skeleton />
  ) : (
    <SeasonStatisticsProvider value={{ seasonData: seasonData }}>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: 2,
        }}
      >
        {session && (
          <>
            <WeeklyScoreCard
              userName={session?.user?.name}
              week={week}
              userStats={userStats}
              currentWeek
              pickedThisWeek={pickedThisWeek}
            />
            <WeeklyScoreCard
              userName={session?.user?.name}
              week={{ ...week, week: week.week - 1 }}
              userStats={userStats}
            />
          </>
        )}
        <Card>
          <CardContent>
            <h1>Slackers</h1>
            <p>Users who did not pick yet this week:</p>
            <AvatarGroup max={30} className={cssStyles.avatarGroup}>
              {usersForThisSeason
                .filter((user) => !usersWhoPicked.includes(user))
                .filter((user) => user.npc !== true)
                .map((user) => (
                  <Tooltip key={user.name} title={user.name} arrow>
                    <Avatar
                      className={
                        user.name === session?.user?.name
                          ? cssStyles.hilitedAvatar
                          : user.npc
                          ? cssStyles.npcAvatar
                          : cssStyles.avatar
                      }
                      key={user.name}
                      alt={user.name}
                      src={user?.image}
                    ></Avatar>
                  </Tooltip>
                ))}
            </AvatarGroup>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h1>Over-Achievers</h1>
            <p>Users who picked games this week:</p>
            <AvatarGroup max={30} className={cssStyles.avatarGroup}>
              {usersWhoPicked.map((user) => (
                <Tooltip key={user.name} title={user.name} arrow>
                  <Avatar
                    className={
                      user.name === session?.user?.name
                        ? cssStyles.hilitedAvatar
                        : user.npc
                        ? cssStyles.npcAvatar
                        : cssStyles.avatar
                    }
                    key={user.name}
                    alt={user.name}
                    src={user?.image}
                  ></Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </CardContent>
        </Card>
      </Box>
    </SeasonStatisticsProvider>
  );
}
