"use client";
import cssStyles from "./gameScoreTile.module.css";
import TeamTile from "../teams/teamTile";
import { Chip, Tooltip, Avatar, AvatarGroup } from "@mui/material";
import { LooksOne, LooksTwo, Looks3, Looks4, Sports, LiveTv, Update } from "@mui/icons-material";

export default function GameScoreTile({ game, liveDetails, users, activeUser }) {
  const startTime = new Date(game.startTime);
  const favorite = game.awayFavorite ? game.away : game.home;
  const underdog = game.awayFavorite ? game.home : game.away;
  const favScore = game.awayFavorite ? liveDetails.awayScore : liveDetails.homeScore;
  const undScore = game.awayFavorite ? liveDetails.homeScore : liveDetails.awayScore;
  const ffHighlight = favScore - game.spread > undScore ? cssStyles.highlight : "";
  const ufHighlight =
    favScore - game.spread < undScore && favScore > undScore
      ? cssStyles.highlight
      : favScore === undScore
      ? cssStyles.highlightTies
      : "";
  const uuHighlight = favScore < undScore ? cssStyles.highlight : "";
  const quarterIcons = [<LooksOne key="1" />, <LooksTwo key="2" />, <Looks3 key="3" />, <Looks4 key="4" />];

  const gameChip =
    liveDetails.playedStatus === "UNPLAYED" ? (
      <Chip label="Upcoming" color="warning" icon={<Update />} />
    ) : liveDetails.playedStatus === "LIVE" ? (
      <Chip label="Live" color="error" icon={<LiveTv />} />
    ) : (
      <Chip label="Final" color="success" icon={<Sports />} />
    );

  const generateAvatars = (choice, index) => {
    const user = users.find((user) => user.name === choice.userId);
    return (
      <Tooltip key={choice.userId} title={choice.userId} arrow>
        <Avatar
          className={choice.userId === activeUser?.name ? cssStyles.hilitedAvatar : cssStyles.avatar}
          key={choice.userId}
          alt={choice.userId}
          src={user?.image}
        >
          {user?.name.substring(0, 1)}
        </Avatar>
      </Tooltip>
    );
  };

  const ffAvatars = game.userChoices
    .map((choice, index) => {
      if (choice.choice === "ff") {
        return generateAvatars(choice, index);
      }
    })
    .sort((a, b) => (a.key === activeUser?.name ? -1 : 1));

  const ufAvatars = game.userChoices
    .map((choice, index) => {
      if (choice.choice === "uf") {
        return generateAvatars(choice, index);
      }
    })
    .sort((a, b) => (a.key === activeUser?.name ? -1 : 1));

  const uuAvatars = game.userChoices
    .map((choice, index) => {
      if (choice.choice === "uu") {
        return generateAvatars(choice, index);
      }
    })
    .sort((a, b) => (a.key === activeUser?.name ? -1 : 1));

  const liveLabel = liveDetails.intermission
    ? liveDetails.intermission === 2
      ? "Halftime"
      : "End of " + liveDetails.intermission
    : Math.floor(liveDetails.timeRemaining / 60) + ":" + (liveDetails.timeRemaining % 60).toString().padStart(2, "0");

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.teams}>
        <TeamTile
          team={favorite}
          home={!game.awayFavorite}
          score={favScore}
          avatars={ffAvatars}
          favorite
          highlight={liveDetails.playedStatus === "UNPLAYED" ? null : ffHighlight}
        />

        <div className={cssStyles.spread + " " + (liveDetails.playedStatus === "UNPLAYED" ? "" : ufHighlight)}>
          {gameChip}

          {game.spread === 0.5 ? "Pick'em" : "-" + game.spread}
          <AvatarGroup max={5} className={cssStyles.avatarGroup} spacing={0}>
            {ufAvatars}
          </AvatarGroup>
          <br />
          {liveDetails.playedStatus === "LIVE" && (
            <Chip
              label={liveLabel}
              color="error"
              icon={liveDetails.intermission ? null : quarterIcons[liveDetails.currentQuarter - 1]}
            />
          )}
        </div>
        <TeamTile
          team={underdog}
          home={game.awayFavorite}
          score={undScore}
          avatars={uuAvatars}
          highlight={liveDetails.playedStatus === "UNPLAYED" ? null : uuHighlight}
        />
      </div>
      <div className={cssStyles.gamelocation}>
        {game.location + " - " + startTime.toLocaleDateString() + " - " + startTime.toLocaleTimeString()}
      </div>
    </div>
  );
}
