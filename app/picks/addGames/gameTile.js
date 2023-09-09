import cssStyles from "./gameTile.module.css";
import TeamTile from "./teamTile";

export default function GameTile(props) {
  const game = props.game;

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gameinfo}>
        Week #{game.week} <p className={cssStyles.gameid}>{game.id}</p>
      </div>
      <div className={cssStyles.teams}>
        <TeamTile team={game.home}/>
        <div className={cssStyles.spread}><input type="number"></input></div>
        <TeamTile team={game.away}/>
      </div>
      <div className={cssStyles.gamelocation}>{game.location}</div>
    </div>
  );
}
