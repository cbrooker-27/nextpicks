"use client";
import cssStyles from "./gameScoreTile.module.css";
import TeamTile from "../teams/teamTile";
import { Chip, Tooltip, Avatar, AvatarGroup } from "@mui/material";
import { Sports, LiveTv, Update } from "@mui/icons-material";

export default function GameScoreTile({ game, liveDetails, users }) {
  const startTime = new Date(game.startTime);
  const favorite = game.awayFavorite ? game.away : game.home;
  const underdog = game.awayFavorite ? game.home : game.away;
  const favScore = game.awayFavorite ? liveDetails.awayScore : liveDetails.homeScore;
  const undScore = game.awayFavorite ? liveDetails.homeScore : liveDetails.awayScore;

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
      <Tooltip key={choice.userId + index} title={choice.userId} arrow>
        <Avatar key={choice.userId + index} sx={{ width: 24, height: 24 }} alt={choice.userId} src={user?.image}>
          {user?.name.substring(0, 1)}
        </Avatar>
      </Tooltip>
    );
  };

  const ffAvatars = game.userChoices.map((choice, index) => {
    if (choice.choice === "ff") {
      return generateAvatars(choice, index);
    }
  });

  const ufAvatars = game.userChoices.map((choice, index) => {
    if (choice.choice === "uf") {
      return generateAvatars(choice, index);
    }
  });

  const uuAvatars = game.userChoices.map((choice, index) => {
    if (choice.choice === "uu") {
      return generateAvatars(choice, index);
    }
  });

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.teams}>
        <TeamTile team={favorite} home={!game.awayFavorite} score={favScore} avatars={ffAvatars} favorite />

        <div className={cssStyles.spread}>
          {gameChip}

          {game.spread === 0.5 ? "Pick'em" : "-" + game.spread}
          <AvatarGroup max={4} className={cssStyles.avatarGroup} spacing={0}>
            {ufAvatars}
          </AvatarGroup>
        </div>
        <TeamTile team={underdog} home={game.awayFavorite} score={undScore} avatars={uuAvatars} />
      </div>
      <div className={cssStyles.gamelocation}>
        {game.location + " - " + startTime.toLocaleDateString() + " - " + startTime.toLocaleTimeString()}
      </div>
    </div>
  );
}
