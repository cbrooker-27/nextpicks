"use client";
import { Skeleton, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { getPickableGames, getCurrentWeek } from "@/utils/db";
import cssClasses from "./viewPicks.module.css";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { useSession } from "next-auth/react";

export default function ViewPicks() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  useEffect(() => {
    async function fetchData() {
      const fetchedGames = await getPickableGames(await getCurrentWeek());
      setGames(fetchedGames);
      setIsLoading(false);
    }
    fetchData();
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
              <Avatar sx={{ width: 24, height: 24 }} alt="Freddy" src="/static/images/avatar/1.jpg" />
              <Avatar sx={{ width: 24, height: 24 }} alt="Chris" src={session?.user?.image} />
              <Avatar sx={{ width: 24, height: 24 }} alt="Cindy Baker" src="/static/images/avatar/3.jpg" />
              <Avatar sx={{ width: 24, height: 24 }} alt="Agnes Walker" src="/static/images/avatar/4.jpg" />
              <Avatar sx={{ width: 24, height: 24 }} alt="Trevor Henderson" src="/static/images/avatar/5.jpg" />
            </AvatarGroup>
          </div>
          <div className={cssClasses.team}>
            {" "}
            at{" "}
            <AvatarGroup>
              <Avatar sx={{ width: 24, height: 24 }} alt="Sammy" src="/static/images/avatar/1.jpg" />
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
              <Tooltip title="Uma" arrow>
                <Avatar sx={{ width: 24, height: 24 }} alt="Uma" src="/static/images/avatar/1.jpg" />
              </Tooltip>
              <Avatar sx={{ width: 24, height: 24 }} alt="Travis Howard" src="/static/images/avatar/2.jpg" />
              <Avatar sx={{ width: 24, height: 24 }} alt="Cindy Baker" src="/static/images/avatar/3.jpg" />
              <Avatar sx={{ width: 24, height: 24 }} alt="Agnes Walker" src="/static/images/avatar/4.jpg" />
              <Avatar sx={{ width: 24, height: 24 }} alt="Trevor Henderson" src="/static/images/avatar/5.jpg" />
            </AvatarGroup>
          </div>
        </div>
      ))}
    </div>
  );
}
