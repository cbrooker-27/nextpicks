"use client";
import cssStyles from "./gameScoreTile.module.css";
import TeamTile from "../teams/teamTile";
import { Chip, Tooltip, Avatar, AvatarGroup } from "@mui/material";
import { LooksOne, LooksTwo, Looks3, Looks4, Sports, LiveTv, Update } from "@mui/icons-material";

export default function GameScoreTile({ game, liveDetails, users, activeUser, teamDetails, includeNpc = true }) {
  const startTime = new Date(game.startTime);
  const favorite = structuredClone(game.awayFavorite ? game.away : game.home);
  const underdog = structuredClone(game.awayFavorite ? game.home : game.away);
  const safeLiveDetails = liveDetails || { playedStatus: "UNAVAILABLE" };
  const favScore = game.awayFavorite ? safeLiveDetails.awayScore : safeLiveDetails.homeScore;
  const undScore = game.awayFavorite ? safeLiveDetails.homeScore : safeLiveDetails.awayScore;
  const hasScores = Number.isFinite(favScore) && Number.isFinite(undScore);
  const ffHighlight = hasScores && favScore - game.spread > undScore ? cssStyles.highlight : "";
  const ufHighlight =
    hasScores && favScore - game.spread < undScore && favScore > undScore
      ? cssStyles.highlight
      : hasScores && favScore === undScore
        ? cssStyles.highlightTies
        : "";
  const uuHighlight = hasScores && favScore < undScore ? cssStyles.highlight : "";
  const quarterIcons = [<LooksOne key="1" />, <LooksTwo key="2" />, <Looks3 key="3" />, <Looks4 key="4" />];
  const missingTeamStats = { wins: "-", losses: "-", ties: "-", pointsFor: "-", pointsAgainst: "-" };
  favorite.stats = teamDetails?.find((team) => team._id === favorite.id) || missingTeamStats;
  underdog.stats = teamDetails?.find((team) => team._id === underdog.id) || missingTeamStats;

  const gameChip =
    safeLiveDetails.playedStatus === "UNPLAYED" ? (
      <Chip label="Upcoming" color="warning" icon={<Update />} />
    ) : safeLiveDetails.playedStatus === "LIVE" ? (
      <Chip label="Live" color="error" icon={<LiveTv />} />
    ) : safeLiveDetails.playedStatus?.startsWith("COMPLETED") ? (
      <Chip label="Final" color="success" icon={<Sports />} />
    ) : (
      <Chip label="Scores unavailable" color="warning" />
    );

  const generateAvatar = (choice) => {
    const user = users.find((user) => user.name === choice.userId);
    if (!user) return null;
    if (user.npc && !includeNpc) return null;
    return (
      <Tooltip key={choice.userId} title={choice.userId} arrow>
        <Avatar
          className={
            choice.userId === activeUser?.name
              ? cssStyles.hilitedAvatar
              : user.npc
                ? cssStyles.npcAvatar
                : cssStyles.avatar
          }
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
    .map((choice) => {
      if (choice.choice === "ff") {
        return generateAvatar(choice);
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.key === activeUser?.name ? 1 : -1));

  const ufAvatars = game.userChoices
    .map((choice) => {
      if (choice.choice === "uf") {
        return generateAvatar(choice);
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.key === activeUser?.name ? 1 : -1));

  const uuAvatars = game.userChoices
    .map((choice) => {
      if (choice.choice === "uu") {
        return generateAvatar(choice);
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.key === activeUser?.name ? 1 : -1));

  const liveLabel = safeLiveDetails.intermission
    ? safeLiveDetails.intermission === 2
      ? "Halftime"
      : "End of " + safeLiveDetails.intermission
    : Math.floor((safeLiveDetails.timeRemaining || 0) / 60) +
      ":" +
      ((safeLiveDetails.timeRemaining || 0) % 60).toString().padStart(2, "0");

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.teams}>
        <div className={cssStyles.gameteam + " " + (safeLiveDetails.playedStatus === "UNPLAYED" ? "" : ffHighlight)}>
          <TeamTile team={favorite} home={!game.awayFavorite} score={favScore} />
          <div className={cssStyles.avatarsTeam}>
            <AvatarGroup max={30} spacing={0}>
              {ffAvatars}
            </AvatarGroup>
          </div>
        </div>
        <div
          className={cssStyles.spreadContainer + " " + (safeLiveDetails.playedStatus === "UNPLAYED" ? "" : ufHighlight)}
        >
          {gameChip}
          <div className={cssStyles.spread}>{game.spread === 0.5 ? "Pick'em" : "-" + game.spread}</div>
          {safeLiveDetails.playedStatus === "LIVE" && (
            <Chip
              label={liveLabel}
              color="error"
              icon={safeLiveDetails.intermission ? null : quarterIcons[safeLiveDetails.currentQuarter - 1]}
            />
          )}
          <div className={cssStyles.avatarsSpread}>
            <AvatarGroup max={30} spacing={0}>
              {ufAvatars}
            </AvatarGroup>
          </div>
        </div>
        <div className={cssStyles.gameteam + " " + (safeLiveDetails.playedStatus === "UNPLAYED" ? "" : uuHighlight)}>
          <TeamTile team={underdog} home={game.awayFavorite} score={undScore} />
          <div className={cssStyles.avatarsTeam}>
            <AvatarGroup max={30} spacing={0}>
              {uuAvatars}
            </AvatarGroup>
          </div>
        </div>
      </div>
      <div className={cssStyles.gamelocation}>
        {game.location + " - " + startTime.toLocaleDateString() + " - " + startTime.toLocaleTimeString()}
      </div>
    </div>
  );
}
