import cssStyles from "./teamTile.module.css";
import { AvatarGroup } from "@mui/material";

export default function TeamTile({ team, home = false, score = null, avatars = null, favorite = false }) {
  return (
    <div className={cssStyles.teamContainer}>
      {favorite && avatars && (
        <AvatarGroup className={cssStyles.avatarGroup} max={7} spacing={0}>
          {avatars}
        </AvatarGroup>
      )}
      <div
        className={cssStyles.team}
        style={{
          backgroundImage: `url('${team.officialLogoImageSrc}')`,
        }}
      >
        <div className={cssStyles.teamname}>
          {team.city} {team.name}
        </div>
        <div className={cssStyles.homeAway}>
          <div>{home ? "HOME" : "AWAY"}</div>
        </div>
      </div>
      <div className={cssStyles.score}>{score}</div>
      {!favorite && avatars && (
        <AvatarGroup className={cssStyles.avatarGroup} max={7} spacing={0}>
          {avatars}
        </AvatarGroup>
      )}
    </div>
  );
}
