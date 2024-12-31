import cssStyles from "./teamTile.module.css";

export default function TeamTile({ team, home }) {
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
          <div>{home ? "HOME" : "AWAY"}</div>
        </div>
      </div>
    </div>
  );
}
