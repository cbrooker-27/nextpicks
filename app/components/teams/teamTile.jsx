import cssStyles from "./teamTile.module.css";
import { AvatarGroup } from "@mui/material";

export default function TeamTile({ team, home = false, score = null, avatars = null }) {
  return (
    <div className={cssStyles.teamContainer}>
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
      {avatars && <AvatarGroup max={8}>{avatars}</AvatarGroup>}
    </div>
  );
}
