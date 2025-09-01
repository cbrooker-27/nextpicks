import cssStyles from "./addGameTile.module.css";
import TeamTile from "../teams/teamTile";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FavoriteSwitch from "./favoriteSwitch";

export default function AddGameTile(props) {
  const game = props.game;
  const startTime = new Date(game.startTime);

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gameinfo}>
        Week #{game.week} <p className={cssStyles.gameid}>{game._id}</p>
      </div>
      <div className={cssStyles.teams}>
        <TeamTile team={game.home} home />
        <div className={cssStyles.spread}>
          <input type="number" onChange={(event) => props.spreadUpdated(props.index, event)}></input>
          <FormGroup>
            <FormControlLabel
              control={<FavoriteSwitch game={game} gameIndex={props.index} favoriteUpdated={props.favoriteUpdated} />}
              label="Favorite"
              labelPlacement="top"
            />
          </FormGroup>
        </div>
        <TeamTile team={game.away} />
      </div>
      <div className={cssStyles.gamelocation}>
        {game.location + " - " + startTime.toLocaleDateString() + " - " + startTime.toLocaleTimeString()}
      </div>
    </div>
  );
}
