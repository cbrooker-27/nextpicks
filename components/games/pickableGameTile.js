import cssStyles from "./pickableGameTile.module.css";
import TeamTile from "../teams/teamTile";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useState } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

export default function PickableGameTile({ game }) {
  const [choice, setChoice] = useState("");
  const [ffStyle, setFFStyle] = useState({ color: "white" });
  const [ufStyle, setUFStyle] = useState({ color: "white" });
  const [uuStyle, setUUStyle] = useState({ color: "white" });
  const handleChange = (event, newChoice) => {
    if (newChoice === "ff") {
      setFFStyle({
        color: game.home.teamColoursHex[1],
        backgroundColor: game.home.teamColoursHex[0],
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
        color: game.away.teamColoursHex[1],
        backgroundColor: game.away.teamColoursHex[0],
      });
    }
    setChoice(newChoice);
  };

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gamemain}>
        <div className={cssStyles.gameteam}>
          <TeamTile team={game.home} home />
        </div>
        <div className={cssStyles.spread}>{game.spread}</div>
        <div className={cssStyles.gameteam}>
          <TeamTile className={cssStyles.gameteam} team={game.away} />
        </div>
      </div>
      <ToggleButtonGroup
        orientation="vertical"
        value={choice}
        exclusive
        onChange={handleChange}
        className={cssStyles.choices}
      >
        <ToggleButton
          value="ff"
          aria-label="ff"
          style={ffStyle}
          className={cssStyles.choice}
        >
          <img src={`${game.home.officialLogoImageSrc}`} height="25px" />
          {"---"}
          {`${game.home.name} will win by more than ${game.spread}`}
        </ToggleButton>
        <ToggleButton
          value="uf"
          aria-label="uf"
          style={ufStyle}
          className={cssStyles.choice}
        >
          {`${game.home.name} will win by less than ${game.spread}`}
        </ToggleButton>
        <ToggleButton
          value="uu"
          aria-label="uu"
          style={uuStyle}
          className={cssStyles.choice}
        >
          <img src={`${game.away.officialLogoImageSrc}`} height="25px" />
          {"---"}
          {`${game.away.name} will win`}{" "}
        </ToggleButton>
      </ToggleButtonGroup>
      <div className={cssStyles.gamefooter}>
        {game.location} - <p className={cssStyles.gameid}>{game._id}</p>
      </div>
    </div>
  );
}
