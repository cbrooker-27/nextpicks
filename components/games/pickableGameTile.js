import cssStyles from "./pickableGameTile.module.css";
import TeamTile from "../teams/teamTile";
import { useState } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

export default function PickableGameTile({ game }) {
  const [choice, setChoice] = useState("");
  const [ffStyle, setFFStyle] = useState({ color: "white" });
  const [ufStyle, setUFStyle] = useState({ color: "white" });
  const [uuStyle, setUUStyle] = useState({ color: "white" });
  const favorite = game.awayFavorite ? game.away : game.home;
  const underdog = game.awayFavorite ? game.home : game.away;
  const handleChange = (event, newChoice) => {
    if (newChoice === "ff") {
      setFFStyle({
        color: favorite.teamColoursHex[1],
        backgroundColor: favorite.teamColoursHex[0],
      });
      setUFStyle({ color: "white" });
      setUUStyle({ color: "white" });
    } else if (newChoice === "uf") {
      setFFStyle({ color: "white" });
      setUFStyle({ color: "green" });
      setUUStyle({ color: "white" });
    } else if (newChoice === "uu") {
      setFFStyle({ color: "white" });
      setUFStyle({ color: "white" });
      setUUStyle({
        color: underdog.teamColoursHex[1],
        backgroundColor: underdog.teamColoursHex[0],
      });
    }
    setChoice(newChoice);
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
          <img src={`${favorite.officialLogoImageSrc}`} height="25px" />
          {"---"}
          {`${favorite.name} will win by more than ${game.spread}`}
        </ToggleButton>
        <ToggleButton value="uf" aria-label="uf" style={ufStyle} className={cssStyles.choice}>
          {`${favorite.name} will win by less than ${game.spread}`}
        </ToggleButton>
        <ToggleButton value="uu" aria-label="uu" style={uuStyle} className={cssStyles.choice}>
          <img src={`${underdog.officialLogoImageSrc}`} height="25px" />
          {"---"}
          {`${underdog.name} will win`}{" "}
        </ToggleButton>
      </ToggleButtonGroup>
      <div className={cssStyles.gamefooter}>
        {game.location} - <p className={cssStyles.gameid}>{game._id}</p>
      </div>
    </div>
  );
}
