"use client";
import { useEffect, useState } from "react";
import { getAllUserFromDb, getCurrentWeek, getThisWeeksPickedGames } from "./utils/db";
import { useSession } from "next-auth/react";
import { Box, Card, CardContent, Skeleton, Tooltip, Avatar, AvatarGroup } from "@mui/material";
import cssStyles from "./page.module.css";

export default function Home() {
  const [pickedGames, setPickedGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [week, setWeek] = useState(null);
  const { data: session, status } = useSession();

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
    <>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))",
          gap: 2,
        }}
      >
        {session && (
          <Card sx={{ backgroundColor: pickedThisWeek ? "green" : "yellow" }}>
            <CardContent sx={{ height: "100%" }}>
              <h1>Week {week.week}!</h1>
              <p>You have {pickedThisWeek ? " already picked" : "not picked"} games this week!</p>
              <p>Use the navigation menu to access different features.</p>
            </CardContent>
          </Card>
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
    </>
  );
}
