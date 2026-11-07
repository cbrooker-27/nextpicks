import cssStyles from "./addGameTile.module.css";
import FavoriteSwitch from "./favoriteSwitch";

export default function AddGameTile(props) {
  const { game } = props;
  const favoriteTeam = game.awayFavorite ? game.away : game.home;

  return (
    <div className={cssStyles.gametile}>
      <div className={cssStyles.teams}>
        <div className={cssStyles.team}>
          <span
            className={cssStyles.logo}
            style={{ backgroundImage: `url('${game.home.officialLogoImageSrc}')` }}
            aria-hidden="true"
          />
          <span className={cssStyles.teamName}>
            <span className={cssStyles.teamCity}>{game.home.city}</span>
            <span className={cssStyles.teamMascot}>{game.home.name}</span>
          </span>
        </div>
        <div className={cssStyles.spread}>
          <input
            id={`spread-${game._id}`}
            type="number"
            min="0"
            step="1"
            aria-label={`${game.home.name} versus ${game.away.name} spread`}
            value={game.spread == null ? "" : game.spread - 0.5}
            onChange={(event) => props.spreadUpdated(props.index, event)}
          />
          <div className={cssStyles.favoriteSwitch}>
            <FavoriteSwitch
              game={game}
              gameIndex={props.index}
              favoriteUpdated={props.favoriteUpdated}
              favoriteName={`${favoriteTeam.city} ${favoriteTeam.name} favored`}
            />
          </div>
        </div>
        <div className={`${cssStyles.team} ${cssStyles.awayTeam}`}>
          <span
            className={cssStyles.logo}
            style={{ backgroundImage: `url('${game.away.officialLogoImageSrc}')` }}
            aria-hidden="true"
          />
          <span className={cssStyles.teamName}>
            <span className={cssStyles.teamCity}>{game.away.city}</span>
            <span className={cssStyles.teamMascot}>{game.away.name}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
