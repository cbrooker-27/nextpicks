import cssStyles from "./teamTile.module.css";

export default function TeamTile(props) {
  const team = props.team;
  return (
    <div className={cssStyles.teamContainer}>
      <div
        className={cssStyles.team}
        style={{
          backgroundImage: `url('${team.officialLogoImageSrc}')`,
        }}
      >
        <div className={cssStyles.teamname}>
          {team.city} {team.name}
        </div>
        <div className={cssStyles.homeAway}>
          {props.home && <div>HOME</div>}
          {!props.home && <div>AWAY</div>}
        </div>
      </div>
    </div>
  );
}
