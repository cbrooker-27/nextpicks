import cssStyles from "./teamTile.module.css";
import { Bitcount_Prop_Single } from "next/font/google";
import { Collapse, Fade, Slide, Zoom } from "@mui/material";
import { useRef, useState } from "react";
import { useSeasonStatistics } from "@/app/context/SeasonStatistics";

// Using Bitcount font for scores
const bitcount = Bitcount_Prop_Single({ subsets: ["latin"], display: "swap" });

export default function TeamTile({ team, home = false, score = null, showDetails = false }) {
  const { seasonData } = useSeasonStatistics();
  const gamesForThisTeam = seasonData.filter(
    (game) => game.home.id === team.id || game.away.id === team.id // && game.week < seasonData.currentWeek
  );
  gamesForThisTeam.sort((a, b) => b.week - a.week);

  // const displayRef = useRef(null);
  return (
    <div className={cssStyles.teamContainer}>
      <div
        className={cssStyles.team}
        style={{
          backgroundImage: `url('${team.officialLogoImageSrc}')`,
          overflow: "hidden",
        }}
        // ref={displayRef}
      >
        <div className={cssStyles.teamname}>
          {team.city} {team.name} <br />
          {`${team.stats.wins}-${team.stats.losses}-${team.stats.ties}`}
          {/* <Collapse in={showDetails} collapsedSize={10}> */}
          {/* <Slide in={showDetails} timeout={1000} container={displayRef.current} direction="left"> */}
          {/* <Zoom in={showDetails} timeout={1000}> */}
          {showDetails && (
            <Fade in={showDetails} timeout={1000}>
              <div
                className={cssStyles.teamStats}
                style={{
                  overflowY: "scroll",
                  background: `linear-gradient(135deg, ${team.teamColoursHex[0]} 0%, ${team.teamColoursHex[1]} 100%)`,
                }}
              >
                PF: {team.stats.pointsFor} <br /> PA: {team.stats.pointsAgainst} <br />
                <hr />
                {gamesForThisTeam.map((game, index) => (
                  <div key={game._id}>
                    Wk {game.week}: {game.home.abbreviation} {game.homeScore} - {game.away.abbreviation}{" "}
                    {game.awayScore} <br />
                  </div>
                ))}
              </div>
            </Fade>
          )}
          {/* </Slide> */}
          {/* </Zoom> */}
          {/* </Collapse> */}
        </div>
        <div className={cssStyles.homeAway}>
          <div>{home ? "HOME" : "AWAY"}</div>
          <div className={`${cssStyles.score} ${bitcount.className}`}>{score}</div>
        </div>
      </div>
    </div>
  );
}
