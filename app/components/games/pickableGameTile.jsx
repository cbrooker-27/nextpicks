import cssStyles from "./pickableGameTile.module.css";
import TeamTile from "../teams/teamTile";
import { useState } from "react";
import Image from "next/image";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Button, FormControlLabel, Switch } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function PickableGameTile({ game, index, choiceChanged, teamDetails, initialChoice }) {
  const [choice, setChoice] = useState(initialChoice || "");
  const [editing, setEditing] = useState(!initialChoice);
  const [checked, setChecked] = useState(false);
  const favorite = structuredClone(game.awayFavorite ? game.away : game.home);
  const underdog = structuredClone(game.awayFavorite ? game.home : game.away);
  favorite.stats = teamDetails.find((team) => team._id === favorite.id);
  underdog.stats = teamDetails.find((team) => team._id === underdog.id);

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
  const gameStarted = startTime <= new Date();
  const pickLocked = gameStarted || (Boolean(initialChoice) && !editing);
  const handleChange = (event, newChoice) => {
    if (pickLocked) return;
    setChoice(newChoice);
    choiceChanged(index, newChoice);
  };

  return (
    <div className={`${cssStyles.gametile} ${gameStarted ? cssStyles.locked : ""}`}>
      {(gameStarted || (initialChoice && !editing)) && (
        <div className={cssStyles.lockBanner}>
          {gameStarted ? <LockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          {gameStarted ? "Game started - pick locked" : "Submitted"}
          {!gameStarted && (
            <Button color="inherit" size="small" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
              Edit pick
            </Button>
          )}
        </div>
      )}
      <div className={cssStyles.gamemain}>
        <div className={cssStyles.gameteam}>
          <TeamTile team={favorite} home={!game.awayFavorite} showDetails={checked} />
        </div>
        <div className={cssStyles.spread}>
          {game.spread === 0.5 ? (
            <>
              Pick
              <br />
              &apos;em
            </>
          ) : (
            game.spread
          )}
          <br />

          <FormControlLabel
            labelPlacement="bottom"
            control={<Switch size="small" checked={checked} onChange={() => setChecked(!checked)} />}
            label="Details"
            style={{ paddingTop: "20px", paddingBottom: "45px" }}
          />
        </div>
        <div className={cssStyles.gameteam}>
          <TeamTile team={underdog} home={game.awayFavorite} showDetails={checked} />
        </div>
      </div>
      <ToggleButtonGroup
        orientation="vertical"
        value={choice}
        exclusive
        onChange={handleChange}
        className={cssStyles.choices}
        disabled={pickLocked}
      >
        <ToggleButton value="ff" aria-label="ff" style={ffStyle} className={cssStyles.choice}>
          <Image alt="" src={`${favorite.officialLogoImageSrc}`} height="25" width="25" />
          {"---"}
          {favorite.name + " will win" + (game.spread !== 0.5 ? ` by more than ${game.spread}` : "")}
        </ToggleButton>
        {game.spread !== 0.5 && (
          <ToggleButton value="uf" aria-label="uf" style={ufStyle} className={cssStyles.choice}>
            {`${favorite.name} will win by less than ${game.spread}`}
          </ToggleButton>
        )}
        <ToggleButton value="uu" aria-label="uu" style={uuStyle} className={cssStyles.choice}>
          <Image alt="" src={`${underdog.officialLogoImageSrc}`} height="25" width="25" />
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
