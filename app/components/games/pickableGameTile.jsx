import cssStyles from "./pickableGameTile.module.css";
import TeamTile from "../teams/teamTile";
import { useState } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

export default function PickableGameTile({ game, index, choiceChanged }) {
  const [choice, setChoice] = useState("");
  const favorite = game.awayFavorite ? game.away : game.home;
  const underdog = game.awayFavorite ? game.home : game.away;
  let ffStyle = { color: "white" };
  let ufStyle = { color: "white" };
  let uuStyle = { color: "white" };

  if (choice === "ff") {
    ffStyle = {
      color: favorite.teamColoursHex[1],
      backgroundColor: favorite.teamColoursHex[0],
      border: "1px solid " + favorite.teamColoursHex[1],
    };
  } else if (choice === "uf") {
    ufStyle = { color: "orange", backgroundColor: "lightyellow", border: "1px solid orange" };
  } else if (choice === "uu") {
    uuStyle = {
      color: underdog.teamColoursHex[1],
      backgroundColor: underdog.teamColoursHex[0],
      border: "1px solid " + underdog.teamColoursHex[1],
    };
  }
  const startTime = new Date(game.startTime);
  const handleChange = (event, newChoice) => {
    setChoice(newChoice);
    choiceChanged(index, newChoice);
  };

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gamemain}>
        <div className={cssStyles.gameteam}>
          <TeamTile team={favorite} home={!game.awayFavorite} />
        </div>
        <div className={cssStyles.spread}>{game.spread}</div>
        <div className={cssStyles.gameteam}>
          <TeamTile team={underdog} home={game.awayFavorite} />
        </div>
      </div>
      <ToggleButtonGroup
        orientation="vertical"
        value={choice}
        exclusive
        onChange={handleChange}
        className={cssStyles.choices}
      >
        <ToggleButton value="ff" aria-label="ff" style={ffStyle} className={cssStyles.choice}>
          <img alt="" src={`${favorite.officialLogoImageSrc}`} height="25px" />
          {"---"}
          {`${favorite.name} will win by more than ${game.spread}`}
        </ToggleButton>
        <ToggleButton value="uf" aria-label="uf" style={ufStyle} className={cssStyles.choice}>
          {`${favorite.name} will win by less than ${game.spread}`}
        </ToggleButton>
        <ToggleButton value="uu" aria-label="uu" style={uuStyle} className={cssStyles.choice}>
          <img alt="" src={`${underdog.officialLogoImageSrc}`} height="25px" />
          {"---"}
          {`${underdog.name} will win`}{" "}
        </ToggleButton>
      </ToggleButtonGroup>
      <div className={cssStyles.gamefooter}>
        {game.location + " - " + startTime.toLocaleDateString() + " - " + startTime.toLocaleTimeString()}
      </div>
    </div>
  );
}
