import cssStyles from "./teamTile.module.css";
import { Bitcount_Prop_Single } from "next/font/google";
import { AvatarGroup, Collapse, Fade, Slide, Zoom } from "@mui/material";
import { useRef, useState } from "react";

// Using Bitcount font for scores
const bitcount = Bitcount_Prop_Single({ subsets: ["latin"] });

export default function TeamTile({
  team,
  home = false,
  score = null,
  avatars = null,
  favorite = false,
  highlight = "",
  showDetails = false,
}) {
  const displayRef = useRef(null);
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
          overflow: "hidden",
        }}
        ref={displayRef}
      >
        <div className={cssStyles.teamname}>
          {team.city} {team.name} <br />
          {`${team.stats.wins}-${team.stats.losses}-${team.stats.ties}`}
          {/* <Collapse in={showDetails} collapsedSize={10}> */}
          {/* <Slide in={showDetails} timeout={1000} container={displayRef.current} direction="left"> */}
          {/* <Zoom in={showDetails} timeout={1000}> */}
          <Fade in={showDetails} timeout={1000}>
            <div
              className={cssStyles.teamStats}
              style={{
                background: `linear-gradient(135deg, ${team.teamColoursHex[0]} 0%, ${team.teamColoursHex[1]} 100%)`,
              }}
            >
              PF: {team.stats.pointsFor} <br /> PA: {team.stats.pointsAgainst} <br />
            </div>
          </Fade>
          {/* </Slide> */}
          {/* </Zoom> */}
          {/* </Collapse> */}
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
