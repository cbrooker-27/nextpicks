"use client";
import { Skeleton, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { getAllUserFromDb, getThisWeeksPickedGames } from "@/utils/db";
import cssClasses from "./viewPicks.module.css";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { useSession } from "next-auth/react";

export default function ViewPicks() {
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  useEffect(() => {
    async function fetchData() {
      const fetchedGames = await getThisWeeksPickedGames();
      const users = await getAllUserFromDb();
      setUsers(JSON.parse(users));
      setGames(JSON.parse(fetchedGames));
      setIsLoading(false);
    }
    void fetchData();
  }, []);

  return isLoading ? (
    <Skeleton />
  ) : (
    <div>
      View Picks
      {games.map((game, index) => (
        <div key={index} className={cssClasses.game}>
          <div
            className={cssClasses.team}
            style={{
              backgroundColor: game.away.teamColoursHex[0],
              color: game.away.teamColoursHex[1],
            }}
          >
            {game.away.name}
            <AvatarGroup>
              {game.userChoices.map(
                (choice) =>
                  choice.choice === "ff" && (
                    <Tooltip key={choice.userId} title={choice.userId} arrow>
                      <Avatar
                        key={choice.userId}
                        sx={{ width: 24, height: 24 }}
                        alt={choice.userId}
                        src={users.find((user) => user.name === choice.userId)?.image}
                      />
                    </Tooltip>
                  )
              )}
            </AvatarGroup>
          </div>
          <div className={cssClasses.team}>
            {" "}
            at{" "}
            <AvatarGroup>
              {game.userChoices.map(
                (choice) =>
                  choice.choice === "uf" && (
                    <Tooltip key={choice.userId} title={choice.userId} arrow>
                      <Avatar
                        key={choice.userId}
                        sx={{ width: 24, height: 24 }}
                        alt={choice.userId}
                        src={users.find((user) => user.name === choice.userId)?.image}
                      />
                    </Tooltip>
                  )
              )}
            </AvatarGroup>
          </div>
          <div
            className={cssClasses.team}
            style={{
              backgroundColor: game.home.teamColoursHex[0],
              color: game.home.teamColoursHex[1],
            }}
          >
            {game.home.name}
            <AvatarGroup>
              {game.userChoices.map(
                (choice) =>
                  choice.choice === "uu" && (
                    <Tooltip key={choice.userId} title={choice.userId} arrow>
                      <Avatar
                        key={choice.userId}
                        sx={{ width: 24, height: 24 }}
                        alt={choice.userId}
                        src={users.find((user) => user.name === choice.userId)?.image}
                      />
                    </Tooltip>
                  )
              )}
            </AvatarGroup>
          </div>
        </div>
      ))}
    </div>
  );
}
