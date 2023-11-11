import cssStyles from "./teamTile.module.css";

export default function TeamTile(props) {
  const team = props.team;
  return (
    <div
      className={cssStyles.team}
      style={{
        backgroundImage: `url('${team.officialLogoImageSrc}')`,
      }}
    >
      <div className={cssStyles.teamname}>
        {team.city} {team.name}
      </div>
      {props.home && <div>HOME</div>}
      {!props.home && <div>AWAY</div>}
    </div>
  );
}
