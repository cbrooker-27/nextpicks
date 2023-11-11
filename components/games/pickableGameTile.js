import cssStyles from "./pickableGameTile.module.css";
import TeamTile from "../teams/teamTile";

export default function PickableGameTile(props) {
  const game = props.game;

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.gamemain}>
        <div className={cssStyles.gameteam}><TeamTile  team={game.home} home /></div>
        <div className={cssStyles.spread}>{game.spread}</div>
        <div className={cssStyles.gameteam}><TeamTile className={cssStyles.gameteam} team={game.away} /></div>
      </div>
      <div className={cssStyles.gamefooter}>
        {game.location} - <p className={cssStyles.gameid}>{game.id}</p>
      </div>
    </div>
  );
}
