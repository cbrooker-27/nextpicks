"use client";
import { Skeleton, Tooltip, Chip } from "@mui/material";
import { Sports, LiveTv, Update } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { getAllUserFromDb, getThisWeeksPickedGames } from "@/app/utils/db";
import cssClasses from "./viewPicks.module.css";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { useSession } from "next-auth/react";
import { getThisWeeksGamesFromMsf } from "@/app/lib/msf.js";

export default function ViewPicks() {
  const [pickedGames, setPickedGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  useEffect(() => {
    async function fetchData() {
      const fetchedPicks = await getThisWeeksPickedGames();
      const users = await getAllUserFromDb();
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
      {pickedGames.map((game, index) => {
        const gameData = gamesWithScores.find((g) => g._id === game._id);
        const gameChip =
          gameData.playedStatus === "UNPLAYED" ? (
            <Chip label="Upcoming" color="primary" icon={<Update />} />
          ) : gameData.playedStatus === "LIVE" ? (
            <Chip label="Live" color="secondary" icon={<LiveTv />} />
          ) : (
            <Chip label="Final" color="default" icon={<Sports />} />
          );
        return (
          <div key={index} className={cssClasses.game}>
            {gameChip}
            <div
              className={cssClasses.team}
              style={{
                backgroundColor: game.away.teamColoursHex[0],
                color: game.away.teamColoursHex[1],
              }}
            >
              {/* TODO the FF and UF and UU options are not in the right
            place currently since this is listed as "away at home" */}
              {game.away.name}
              {gameData.playedStatus !== "UNPLAYED" && "-" + gameData.awayScore}
              <AvatarGroup>
                {game.userChoices.map(
                  (choice, index) =>
                    choice.choice === "ff" && (
                      <Tooltip key={choice.userId + index} title={choice.userId} arrow>
                        <Avatar
                          key={choice.userId + index}
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
              at
              <AvatarGroup>
                {game.userChoices.map(
                  (choice, index) =>
                    choice.choice === "uf" && (
                      <Tooltip key={choice.userId + index} title={choice.userId} arrow>
                        <Avatar
                          key={choice.userId + index}
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
              {gameData.playedStatus !== "UNPLAYED" && "-" + gameData.homeScore}
              <AvatarGroup>
                {game.userChoices.map(
                  (choice, index) =>
                    choice.choice === "uu" && (
                      <Tooltip key={choice.userId + index} title={choice.userId} arrow>
                        <Avatar
                          key={choice.userId + index}
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
        );
      })}
    </div>
  );
}
