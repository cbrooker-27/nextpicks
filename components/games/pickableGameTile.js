import cssStyles from "./gameTile.module.css";
import TeamTile from "../teams/teamTile";

export default function PickableGameTile(props) {
  const game = props.game;

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gameinfo}>
        Week #{game.week} <p className={cssStyles.gameid}>{game.id}</p>
      </div>
      <div className={cssStyles.teams}>
        <TeamTile team={game.home} home />
        <div className={cssStyles.spread}>
          {game.spread}
        </div>
        <TeamTile team={game.away} />
      </div>
      <div className={cssStyles.gamelocation}>{game.location}</div>
    </div>
  );
}
