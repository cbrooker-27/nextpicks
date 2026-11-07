import cssStyles from "./addGameTile.module.css";
import TeamTile from "../teams/teamTile";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FavoriteSwitch from "./favoriteSwitch";

export default function AddGameTile(props) {
  const game = structuredClone(props.game);
  const startTime = new Date(game.startTime);
  game.home.stats = props.teamDetails.find((team) => team._id === game.home.id);
  game.away.stats = props.teamDetails.find((team) => team._id === game.away.id);

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gameinfo}>
        Week #{game.week} <p className={cssStyles.gameid}>{game._id}</p>
      </div>
      <div className={cssStyles.teams}>
        <TeamTile team={game.home} home />
        <div className={cssStyles.spread}>
          <label htmlFor={`spread-${game._id}`}>Spread</label>
          <input
            id={`spread-${game._id}`}
            type="number"
            min="0"
            step="1"
            value={game.spread == null ? "" : game.spread - 0.5}
            onChange={(event) => props.spreadUpdated(props.index, event)}
          />
          {props.odds && (
            <div className={cssStyles.odds}>
              {game[props.odds.awayFavorite ? "away" : "home"].name} favored by {props.odds.spread}
              {props.odds.source ? ` (${props.odds.source})` : ""}
            </div>
          )}
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
