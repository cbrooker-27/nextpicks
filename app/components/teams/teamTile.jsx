import cssStyles from "./teamTile.module.css";
import { Bitcount_Prop_Single } from "next/font/google";
import { AvatarGroup } from "@mui/material";

const bitcount = Bitcount_Prop_Single({ subsets: ["latin"] });

export default function TeamTile({
  team,
  home = false,
  score = null,
  avatars = null,
  favorite = false,
  highlight = "",
}) {
  return (
    <div className={cssStyles.teamContainer + " " + highlight}>
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
          <div className={`${cssStyles.score} ${bitcount.className}`}>{score}</div>
        </div>
      </div>
      {!favorite && avatars && (
        <AvatarGroup className={cssStyles.avatarGroup} max={7} spacing={0}>
          {avatars}
        </AvatarGroup>
      )}
    </div>
  );
}
